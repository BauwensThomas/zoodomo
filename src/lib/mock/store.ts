import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type {
  Account,
  AccountMessage,
  AccountMessageKind,
  AccountPhoto,
  AccountRating,
  AccountTheme,
  Animal,
  AnimalBadge,
  AnimalPhoto,
  AnimalView,
  Locale,
  MessageStatus,
  StatutAnimal,
  SupportMessage,
  SupportReason,
  TypeBadge,
} from "@/types";
import { slugify } from "@/lib/slugify";

/**
 * Requêtes Supabase pour tout ce qui touche un compte (thème, photos, animaux, messages).
 * Chaque fonction prend le client Supabase en premier paramètre : `createClient()`
 * (`src/lib/supabase/server.ts`, respecte RLS, contexte du compte connecté) depuis l'espace
 * membre, `createAdminClient()` (`src/lib/supabase/admin.ts`, service_role) depuis les pages
 * publiques et le panneau admin. Remplace l'ancien store en mémoire, voir docs/DECISIONS.md
 * (migration complète du 2026-08-22) et `supabase/migrations/0005_full_data_rls.sql`.
 */

/** Nombre de lignes par page, plafond par défaut de l'API REST Supabase/PostgREST sur toute
 * requête sans `.range()` explicite (silencieux : au-delà, les lignes en trop manquent
 * purement et simplement, sans erreur). Voir docs/DECISIONS.md. */
const PAGE_SIZE = 1000;

/** Récupère TOUTES les lignes d'une requête en la paginant automatiquement par blocs de
 * `PAGE_SIZE`, pour ne jamais perdre silencieusement de données au-delà de la limite par
 * défaut de l'API REST. `queryPage` reçoit les bornes `[from, to]` d'une page et doit
 * renvoyer la requête Supabase déjà construite avec `.range(from, to)` appliqué. À utiliser
 * pour toute liste dont la taille dépend du nombre de comptes ou de fiches (donc sans borne
 * fixe connue à l'avance), pas pour une liste déjà bornée par nature (photos/badges d'un
 * animal, par exemple). */
async function fetchAllPages<T>(
  queryPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await queryPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export async function listAccounts(supabase: SupabaseClient): Promise<Account[]> {
  return fetchAllPages<Account>((from, to) => supabase.from("accounts").select("*").range(from, to));
}

export async function updateAccountLanguesActives(
  supabase: SupabaseClient,
  accountId: string,
  langues: Locale[]
): Promise<void> {
  await supabase.from("accounts").update({ langues_actives: langues }).eq("id", accountId);
}

export async function updateAccountLangueInterface(
  supabase: SupabaseClient,
  accountId: string,
  locale: Locale
): Promise<void> {
  await supabase.from("accounts").update({ langue_interface: locale }).eq("id", accountId);
}

export async function updateAccountThemePreference(
  supabase: SupabaseClient,
  accountId: string,
  theme: "light" | "dark"
): Promise<void> {
  await supabase.from("accounts").update({ theme_preference: theme }).eq("id", accountId);
}

/** Lie un client Paddle à son compte Zoodomo par email (appelé depuis le webhook sur
 * `customer.created`/`customer.updated`, voir `src/app/api/paddle-webhook/route.ts`). Ne
 * fait rien si aucun compte ne correspond (ex. client Paddle créé pour un autre usage). */
export async function linkAccountPaddleCustomerId(
  supabase: SupabaseClient,
  email: string,
  paddleCustomerId: string
): Promise<void> {
  await supabase.from("accounts").update({ paddle_customer_id: paddleCustomerId }).eq("email", email);
}

/** Trouve le compte lié à un `paddle_customer_id` donné, `null` si aucun (cas rare d'un
 * évènement `subscription.*` arrivé avant le `customer.*` correspondant, voir
 * `src/app/api/paddle-webhook/route.ts`). */
export async function getAccountByPaddleCustomerId(
  supabase: SupabaseClient,
  paddleCustomerId: string
): Promise<Account | null> {
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("paddle_customer_id", paddleCustomerId)
    .maybeSingle();
  return (data as Account | null) ?? null;
}

export type PaddleSubscriptionStatus = "active" | "trialing" | "past_due" | "paused" | "canceled";

/** Reflète l'état réel d'un abonnement Paddle sur le compte (webhook `subscription.*`),
 * seule source de vérité pour `plan`/`paddle_subscription_status` : jamais mis à jour
 * directement par une action utilisateur, voir docs/DECISIONS.md. `plan` n'est mis à jour
 * que si l'abonnement est effectivement payant (`active`/`trialing`/`past_due`) et que le
 * prix correspond à un plan connu ; une résiliation (`canceled`) laisse `plan` tel quel
 * (trace historique de ce à quoi le compte était abonné), seul `paddle_subscription_status`
 * change, utilisé pour décider si l'accès doit être bloqué à nouveau (voir `needsPlanChoice`,
 * `src/lib/mock/helpers.ts`). */
export async function upsertAccountPaddleSubscription(
  supabase: SupabaseClient,
  accountId: string,
  input: {
    paddleCustomerId: string;
    paddleSubscriptionId: string;
    status: PaddleSubscriptionStatus;
    plan: "mensuel" | "annuel" | null;
  }
): Promise<void> {
  const { data: current } = await supabase
    .from("accounts")
    .select("paddle_subscription_status")
    .eq("id", accountId)
    .maybeSingle();

  const update: Record<string, string> = {
    paddle_customer_id: input.paddleCustomerId,
    paddle_subscription_id: input.paddleSubscriptionId,
    paddle_subscription_status: input.status,
  };
  // Le délai de grâce de la page publique (`isPublicPageBlocked`) se calcule depuis ce
  // point : ne bouge que quand le statut change vraiment, jamais à chaque redélivrance du
  // même évènement par Paddle (webhooks livrés au moins une fois, voir la compétence
  // d'agent `paddle-webhooks`), sinon le délai de grâce ne s'écoulerait jamais.
  if (current?.paddle_subscription_status !== input.status) {
    update.paddle_subscription_status_changed_at = new Date().toISOString();
  }
  if (input.plan && (input.status === "active" || input.status === "trialing" || input.status === "past_due")) {
    update.plan = input.plan;
  }
  await supabase.from("accounts").update(update).eq("id", accountId);
}

export interface AccountInfoInput {
  nom_affichage: string;
  contact_email_public: string | null;
  contact_telephone_public: string | null;
  adresse: string | null;
  adresse_visible: boolean;
  numero_entreprise: string | null;
  numero_entreprise_visible: boolean;
  a_propos: Partial<Record<Locale, string>>;
}

export async function updateAccountInfo(
  supabase: SupabaseClient,
  accountId: string,
  input: AccountInfoInput
): Promise<void> {
  await supabase.from("accounts").update(input).eq("id", accountId);
}

export async function listAccountPhotosMutable(
  supabase: SupabaseClient,
  accountId: string
): Promise<AccountPhoto[]> {
  const { data } = await supabase
    .from("account_photos")
    .select("*")
    .eq("account_id", accountId)
    .order("ordre", { ascending: true });
  return (data as AccountPhoto[]) ?? [];
}

/** Chemin Storage à partir d'une URL publique (`.../storage/v1/object/public/photos/...`),
 * `null` si l'URL n'est pas une photo de ce bucket (ex. une éventuelle ligne `data:` restante
 * d'avant la migration vers Storage, voir docs/DECISIONS.md). */
function storagePathFromUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/photos/";
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

/** Supprime du bucket les fichiers qui ne sont plus référencés nulle part (photo retirée par
 * le compte, logo remplacé, fiche supprimée). Best-effort : ne fait jamais échouer
 * l'opération appelante si la suppression Storage elle-même échoue. */
async function deleteStorageObjects(supabase: SupabaseClient, urls: string[]): Promise<void> {
  const paths = urls.map(storagePathFromUrl).filter((p): p is string => p !== null);
  if (paths.length > 0) await supabase.storage.from("photos").remove(paths);
}

export interface StorageObjectInfo {
  path: string;
  size: number;
}

/** Liste récursivement tous les fichiers du bucket `photos` sous un préfixe donné (les
 * "dossiers" Storage n'ont pas de `id` propre, il faut descendre dedans plutôt que de les
 * traiter comme un fichier), même algorithme que `scripts/backup-storage.mjs`. Utilisé pour
 * la suppression de compte (tous les fichiers sous `{accountId}/`, couvre `account/`,
 * `animals/` et `logo/` en un seul appel, pas besoin de connaître chaque URL individuelle en
 * base au préalable) et pour l'onglet Photos admin (taille par fichier, `metadata.size` déjà
 * fourni par `list()`, aucune colonne dédiée en base). */
async function listAllStorageObjectsWithInfo(
  supabase: SupabaseClient,
  prefix: string
): Promise<StorageObjectInfo[]> {
  const { data, error } = await supabase.storage.from("photos").list(prefix, { limit: 1000 });
  if (error || !data) return [];
  const files: StorageObjectInfo[] = [];
  for (const entry of data) {
    const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) {
      files.push(...(await listAllStorageObjectsWithInfo(supabase, entryPath)));
    } else {
      files.push({ path: entryPath, size: (entry.metadata?.size as number | undefined) ?? 0 });
    }
  }
  return files;
}

/** Tous les fichiers Storage de tous les comptes, avec leur taille : chaque compte a son
 * propre préfixe (`{accountId}/`), voir `listAllStorageObjectsWithInfo`. Utilisé par l'onglet
 * Photos admin (consultation seule). */
export async function listAllStorageObjectsForAccount(
  supabase: SupabaseClient,
  accountId: string
): Promise<StorageObjectInfo[]> {
  return listAllStorageObjectsWithInfo(supabase, accountId);
}

async function listAllStorageObjects(supabase: SupabaseClient, prefix: string): Promise<string[]> {
  return (await listAllStorageObjectsWithInfo(supabase, prefix)).map((f) => f.path);
}

/** Supprime définitivement tout ce qui appartient à un compte : tous ses fichiers Storage
 * (best-effort, ne bloque jamais la suppression du compte lui-même), puis l'utilisateur
 * `auth.users` correspondant, dont la suppression fait cascader celle de `accounts` et de
 * toutes les tables liées (`account_theme`, `animaux`, `account_photos`, `account_messages`,
 * `support_messages`, `account_message_log`, `animal_badges`, `animal_photos`,
 * `animal_views`, toutes en `on delete cascade` depuis `accounts.id`, lui-même en cascade
 * depuis `auth.users(id)`, voir `supabase/migrations/0004_accounts_fk_auth_users.sql`) :
 * aucune suppression manuelle de ligne nécessaire au-delà de cet appel. `supabase` doit être
 * un client `service_role` (`createAdminClient()`), seul habilité à supprimer un utilisateur
 * Auth. Voir `deleteAccountAction` (`src/app/espace/actions.ts`) pour l'ordre complet
 * (résiliation Paddle d'abord, cette fonction ensuite).
 */
export async function deleteAccountCompletely(supabase: SupabaseClient, accountId: string): Promise<void> {
  const paths = await listAllStorageObjects(supabase, accountId);
  if (paths.length > 0) await supabase.storage.from("photos").remove(paths);

  const { error } = await supabase.auth.admin.deleteUser(accountId);
  if (error) throw error;
}

/** Comptes éligibles à une demande d'avis : abonnement Paddle **payant et actif**
 * (`active` uniquement, pas `trialing`, contrairement à `hasActivePaddleSubscription` :
 * demander un avis n'a de sens qu'à un client qui a réellement payé) depuis au moins
 * `minPaidDays` jours (mesuré depuis `paddle_subscription_status_changed_at`, voir
 * `upsertAccountPaddleSubscription` : ne bouge que quand le statut change vraiment, donc
 * représente bien depuis quand le compte est `active` en continu), et n'ayant pas encore
 * soumis d'avis (ligne absente de `account_ratings`, ou présente mais `submitted_at` encore
 * `null`). Décision utilisateur du 2026-08-25 pour le délai minimum : laisser le temps au
 * compte d'utiliser le service payant avant de lui demander un avis. Envoi en masse à tous
 * les comptes éligibles d'un coup, voir `sendRatingRequestsAction`. */
export async function getEligibleAccountsForRating(
  supabase: SupabaseClient,
  minPaidDays: number
): Promise<Account[]> {
  const cutoff = new Date(Date.now() - minPaidDays * 86_400_000).toISOString();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("paddle_subscription_status", "active")
    .lte("paddle_subscription_status_changed_at", cutoff);
  if (!accounts || accounts.length === 0) return [];

  const { data: submitted } = await supabase
    .from("account_ratings")
    .select("account_id")
    .not("submitted_at", "is", null);
  const submittedIds = new Set((submitted ?? []).map((r) => r.account_id as string));

  return (accounts as Account[]).filter((a) => !submittedIds.has(a.id));
}

/** Crée l'invitation à voter d'un compte, ou régénère `token`/`invited_at` si une relance est
 * envoyée sur une ligne pas encore soumise (`account_id unique`, une seule ligne par compte,
 * jamais de doublon). Retourne le token à insérer dans le lien envoyé. */
export async function upsertRatingInvite(supabase: SupabaseClient, accountId: string): Promise<string> {
  const { data } = await supabase
    .from("account_ratings")
    .upsert(
      { account_id: accountId, token: crypto.randomUUID(), invited_at: new Date().toISOString() },
      { onConflict: "account_id" }
    )
    .select("token")
    .single();
  return data!.token as string;
}

/** Résout un token de la page publique de vote (`/avis/[token]`) en compte associé, `null`
 * seulement si le token n'existe pas du tout. Renvoie la ligne même si l'avis a déjà été
 * soumis (`rating.submitted_at` non nul) : la page distingue alors "lien invalide" de "vote
 * déjà envoyé", deux messages différents, demande utilisateur du 2026-08-25 (auparavant les
 * deux cas étaient confondus). Pas de session Supabase requise, `supabase` doit être un
 * client `service_role`. */
export async function getRatingByToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ rating: AccountRating; account: Account } | null> {
  const { data } = await supabase
    .from("account_ratings")
    .select("*, accounts(*)")
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  const { accounts, ...rating } = data as AccountRating & { accounts: Account };
  return { rating: rating as AccountRating, account: accounts };
}

/** Lien de vote actuel d'un compte (dernier token connu, soumis ou non), `null` si aucune
 * invitation n'a jamais été envoyée. Utilisé par le rendu dynamique du message
 * "avis_demande" (`resolveRatingRequestContent`) : le lien affiché reflète toujours le
 * dernier token en date, même si le compte a été relancé depuis l'envoi du message d'origine. */
export async function getRatingLinkForAccount(
  supabase: SupabaseClient,
  accountId: string
): Promise<{ token: string; alreadyVoted: boolean } | null> {
  const { data } = await supabase
    .from("account_ratings")
    .select("token, submitted_at")
    .eq("account_id", accountId)
    .maybeSingle();
  if (!data) return null;
  return { token: data.token as string, alreadyVoted: data.submitted_at !== null };
}

/** Enregistre le vote soumis via la page publique. `submitted_at is null` dans le `where`
 * garantit qu'un token déjà utilisé ne peut pas revoter (usage unique), même en cas de double
 * clic ou de lien réutilisé. */
export async function submitRating(
  supabase: SupabaseClient,
  token: string,
  stars: number,
  comment: string | null
): Promise<void> {
  const { data } = await supabase
    .from("account_ratings")
    .update({ stars, comment, submitted_at: new Date().toISOString() })
    .eq("token", token)
    .is("submitted_at", null)
    .select("account_id")
    .maybeSingle();

  // Un avis vient d'être donné : le message "avis_demande" correspondant n'a plus besoin de
  // rester mis en évidence comme non lu dans la boîte de réception, demande utilisateur du
  // 2026-08-25.
  if (data) {
    await supabase
      .from("account_messages")
      .update({ read: true })
      .eq("account_id", data.account_id as string)
      .eq("kind", "avis_demande")
      .eq("read", false);
  }
}

/** Tous les avis soumis, avec le nom du compte associé, pour l'onglet Votes admin. */
export async function listSubmittedRatings(
  supabase: SupabaseClient
): Promise<(AccountRating & { account_nom: string })[]> {
  const { data } = await supabase
    .from("account_ratings")
    .select("*, accounts(nom_affichage)")
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false });
  return ((data ?? []) as (AccountRating & { accounts: { nom_affichage: string } })[]).map(
    ({ accounts, ...rating }) => ({ ...rating, account_nom: accounts.nom_affichage })
  );
}

/** Date d'envoi de la dernière demande de vote (toutes lignes confondues, soumises ou non :
 * une relance sur une ligne pas encore soumise met à jour `invited_at`, voir
 * `upsertRatingInvite`), `null` si aucune demande n'a jamais été envoyée. Affiché en haut de
 * l'onglet Votes admin, demande utilisateur du 2026-08-25. */
export async function getLastRatingInviteDate(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from("account_ratings")
    .select("invited_at")
    .order("invited_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.invited_at as string | undefined) ?? null;
}

/** Moyenne et nombre d'avis soumis, sans filtrage par seuil (donnée brute, utilisée telle
 * quelle par l'onglet Votes admin). Le seuil d'affichage public (`MIN_RATINGS_TO_SHOW`) est
 * appliqué séparément par `getPublicRatingSummary` (`src/lib/mock/helpers.ts`), pas ici. */
export async function getRatingSummary(
  supabase: SupabaseClient
): Promise<{ count: number; average: number } | null> {
  const { data } = await supabase.from("account_ratings").select("stars").not("submitted_at", "is", null);
  const stars = (data ?? []).map((r) => r.stars as number);
  if (stars.length === 0) return { count: 0, average: 0 };
  return { count: stars.length, average: stars.reduce((a, b) => a + b, 0) / stars.length };
}

/** Meilleurs commentaires à afficher en rotation sur la page de connexion : les mieux notés
 * (4-5 étoiles) avec un commentaire non vide, les plus récents en premier. Curation
 * entièrement automatique, décision utilisateur du 2026-08-24. Aucune limite : tous les avis
 * qualifiants doivent apparaître dans la rotation, décision utilisateur du 2026-08-25. Nom du
 * compte volontairement absent (jamais affiché publiquement), décision utilisateur du
 * 2026-08-25. */
export async function listBestComments(
  supabase: SupabaseClient
): Promise<{ stars: number; comment: string }[]> {
  const { data } = await supabase
    .from("account_ratings")
    .select("stars, comment")
    .not("submitted_at", "is", null)
    .not("comment", "is", null)
    .neq("comment", "")
    .gte("stars", 4)
    .order("submitted_at", { ascending: false });
  return (data ?? []) as { stars: number; comment: string }[];
}

export async function replaceAccountPhotos(
  supabase: SupabaseClient,
  accountId: string,
  urls: string[]
): Promise<void> {
  const nextSet = new Set(urls.map((u) => u.trim()).filter(Boolean));
  const existing = await listAccountPhotosMutable(supabase, accountId);
  await deleteStorageObjects(
    supabase,
    existing.map((p) => p.url).filter((u) => !nextSet.has(u))
  );

  await supabase.from("account_photos").delete().eq("account_id", accountId);
  const rows = [...nextSet].map((url, index) => ({ account_id: accountId, url, ordre: index + 1 }));
  if (rows.length > 0) await supabase.from("account_photos").insert(rows);
}

export async function getAccountThemeMutable(
  supabase: SupabaseClient,
  accountId: string
): Promise<AccountTheme | undefined> {
  const { data } = await supabase
    .from("account_theme")
    .select("*")
    .eq("account_id", accountId)
    .maybeSingle();
  return (data as AccountTheme) ?? undefined;
}

export async function updateAccountTheme(
  supabase: SupabaseClient,
  accountId: string,
  input: Partial<
    Pick<
      AccountTheme,
      | "lien_retour_site"
      | "police"
      | "couleur_primaire"
      | "couleur_secondaire"
      | "disposition_photos"
      | "disposition_especes"
      | "disposition_presentation"
      | "logo_url"
    >
  >
): Promise<void> {
  // Remplacement du logo : l'ancien fichier n'est plus référencé nulle part une fois
  // écrasé, à supprimer du bucket. `"logo_url" in input` distingue un appel qui touche
  // vraiment le logo (Personnalisation) d'un appel qui ne fait que mettre à jour d'autres
  // champs de account_theme (ex. lien_retour_site depuis la page Compte).
  if ("logo_url" in input) {
    const current = await getAccountThemeMutable(supabase, accountId);
    if (current?.logo_url && current.logo_url !== input.logo_url) {
      await deleteStorageObjects(supabase, [current.logo_url]);
    }
  }

  await supabase
    .from("account_theme")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("account_id", accountId);
}

export async function listAnimauxByAccountAll(
  supabase: SupabaseClient,
  accountId: string
): Promise<Animal[]> {
  return fetchAllPages<Animal>((from, to) =>
    supabase
      .from("animaux")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false })
      .range(from, to)
  );
}

export async function getAnimalById(supabase: SupabaseClient, id: string): Promise<Animal | undefined> {
  const { data } = await supabase.from("animaux").select("*").eq("id", id).maybeSingle();
  return (data as Animal) ?? undefined;
}

/**
 * Date d'entrée dans un statut donné ("réservé" ou "adopté"), gérée automatiquement au
 * changement de statut, jamais saisie à la main : fixée au moment où le statut cible est
 * atteint, effacée si l'animal en repart. Factorisé car `date_reservation` suit exactement
 * la même règle que `date_adoption`, juste pour un statut différent. Fonction pure, ne
 * touche pas la base.
 */
function dateForStatutTarget(
  existingDate: string | null,
  target: StatutAnimal,
  newStatut: StatutAnimal,
  oldStatut: StatutAnimal | null
): string | null {
  if (newStatut !== target) return null;
  return oldStatut === target ? existingDate : new Date().toISOString();
}

/** Même principe que `uniqueAccountSlug` (`src/app/signup-actions.ts`), mais scopé à un
 * compte : deux comptes différents peuvent avoir chacun un animal au même nom sans conflit
 * (contrainte unique composite `(account_id, slug)`, voir
 * `supabase/migrations/0006_animaux_slug_unique_per_account.sql`). */
async function uniqueSlug(
  supabase: SupabaseClient,
  accountId: string,
  base: string,
  excludeId?: string
): Promise<string> {
  const root = slugify(base) || "animal";
  let slug = root;
  let i = 2;
  for (;;) {
    let query = supabase
      .from("animaux")
      .select("id")
      .eq("account_id", accountId)
      .eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    slug = `${root}-${i++}`;
  }
}

export interface AnimalFormInput {
  nom: string;
  espece_id: string;
  race: string | null;
  sexe: Animal["sexe"];
  sterilise: boolean | null;
  annee_naissance: number | null;
  date_naissance: string | null;
  numero_identification: string | null;
  date_arrivee: string | null;
  origine: string | null;
  description: Partial<Record<Locale, string>>;
  foyer_ideal: Partial<Record<Locale, string>>;
  prix: number | null;
  statut: Animal["statut"];
  contact_email: string | null;
  contact_telephone: string | null;
  badges: { type: TypeBadge; label: string }[];
  photoUrls: string[];
}

export async function createAnimal(
  supabase: SupabaseClient,
  accountId: string,
  input: AnimalFormInput
): Promise<Animal> {
  const slug = await uniqueSlug(supabase, accountId, input.nom);
  const { data, error } = await supabase
    .from("animaux")
    .insert({
      account_id: accountId,
      nom: input.nom,
      espece_id: input.espece_id,
      race: input.race,
      sexe: input.sexe,
      sterilise: input.sterilise,
      annee_naissance: input.annee_naissance,
      date_naissance: input.date_naissance,
      numero_identification: input.numero_identification,
      date_arrivee: input.date_arrivee,
      origine: input.origine,
      description: input.description,
      foyer_ideal: input.foyer_ideal,
      prix: input.prix,
      statut: input.statut,
      // Créée directement au statut "adopté"/"réservé" (cas rare) : la date compte depuis maintenant.
      date_adoption: dateForStatutTarget(null, "adopte", input.statut, null),
      date_reservation: dateForStatutTarget(null, "reserve", input.statut, null),
      slug,
      contact_email: input.contact_email,
      contact_telephone: input.contact_telephone,
    })
    .select()
    .single();
  if (error || !data) throw error ?? new Error("createAnimal: échec de l'insertion");

  const animal = data as Animal;
  await replaceBadges(supabase, animal.id, input.badges);
  await replacePhotos(supabase, animal.id, input.photoUrls);
  return animal;
}

export async function updateAnimal(
  supabase: SupabaseClient,
  id: string,
  input: AnimalFormInput
): Promise<Animal | undefined> {
  const existing = await getAnimalById(supabase, id);
  if (!existing) return undefined;

  const date_adoption = dateForStatutTarget(
    existing.date_adoption,
    "adopte",
    input.statut,
    existing.statut
  );
  const date_reservation = dateForStatutTarget(
    existing.date_reservation,
    "reserve",
    input.statut,
    existing.statut
  );
  const slug =
    input.nom === existing.nom
      ? existing.slug
      : await uniqueSlug(supabase, existing.account_id, input.nom, id);

  const { data, error } = await supabase
    .from("animaux")
    .update({
      nom: input.nom,
      espece_id: input.espece_id,
      race: input.race,
      sexe: input.sexe,
      sterilise: input.sterilise,
      annee_naissance: input.annee_naissance,
      date_naissance: input.date_naissance,
      numero_identification: input.numero_identification,
      date_arrivee: input.date_arrivee,
      origine: input.origine,
      description: input.description,
      foyer_ideal: input.foyer_ideal,
      prix: input.prix,
      statut: input.statut,
      date_adoption,
      date_reservation,
      slug,
      contact_email: input.contact_email,
      contact_telephone: input.contact_telephone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return undefined;

  await replaceBadges(supabase, id, input.badges);
  await replacePhotos(supabase, id, input.photoUrls);
  return data as Animal;
}

/**
 * Action rapide depuis "Mes fiches" : change le statut d'un animal (disponible, réservé,
 * adopté) sans repasser par le formulaire complet, et reste réversible dans les deux sens
 * (ex. annuler un clic "adopté" fait par erreur). La visibilité publique découle uniquement
 * du statut (voir `isAnimalVisiblePublicly`), rien d'autre à mettre à jour ici.
 */
export async function changeAnimalStatut(
  supabase: SupabaseClient,
  id: string,
  statut: Animal["statut"]
): Promise<Animal | undefined> {
  const existing = await getAnimalById(supabase, id);
  if (!existing) return undefined;

  const date_adoption = dateForStatutTarget(existing.date_adoption, "adopte", statut, existing.statut);
  const date_reservation = dateForStatutTarget(
    existing.date_reservation,
    "reserve",
    statut,
    existing.statut
  );

  const { data } = await supabase
    .from("animaux")
    .update({ statut, date_adoption, date_reservation, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return (data as Animal) ?? undefined;
}

export async function deleteAnimal(supabase: SupabaseClient, id: string): Promise<void> {
  // `animal_badges`/`animal_photos`/`animal_views` sont en `on delete cascade` (voir
  // supabase/migrations/0001_init.sql) : pas besoin de supprimer ces lignes explicitement,
  // seuls les fichiers Storage correspondants (jamais nettoyés automatiquement par un
  // simple delete de ligne en base) doivent l'être à part.
  const photos = await listPhotosForAnimalMutable(supabase, id);
  await supabase.from("animaux").delete().eq("id", id);
  await deleteStorageObjects(supabase, photos.map((p) => p.url));
}

export async function listBadgesForAnimalMutable(
  supabase: SupabaseClient,
  animalId: string
): Promise<AnimalBadge[]> {
  const { data } = await supabase
    .from("animal_badges")
    .select("*")
    .eq("animal_id", animalId)
    .order("ordre", { ascending: true });
  return (data as AnimalBadge[]) ?? [];
}

export async function listPhotosForAnimalMutable(
  supabase: SupabaseClient,
  animalId: string
): Promise<AnimalPhoto[]> {
  const { data } = await supabase
    .from("animal_photos")
    .select("*")
    .eq("animal_id", animalId)
    .order("ordre", { ascending: true });
  return (data as AnimalPhoto[]) ?? [];
}

/**
 * Compteur de vues basique : chaque affichage de la fiche animal publique compte comme une
 * vue, sans dédoublonnage par visiteur/session. Volontairement simple, conforme à
 * `docs/TODO.md` ("compteur de vues basique") ; un vrai système anti-doublon/anti-bot est
 * repoussé à une étape ultérieure si besoin. Appelée depuis une page publique avec le client
 * service_role (visiteur anonyme, pas de policy d'insert pour `authenticated`).
 */
export async function recordAnimalView(supabase: SupabaseClient, animalId: string): Promise<void> {
  await supabase.from("animal_views").insert({ animal_id: animalId });
}

export async function countViewsForAnimal(supabase: SupabaseClient, animalId: string): Promise<number> {
  const { count } = await supabase
    .from("animal_views")
    .select("*", { count: "exact", head: true })
    .eq("animal_id", animalId);
  return count ?? 0;
}

/** Renvoie les vues horodatées (pas juste le total) pour un ensemble de fiches, utilisé par
 * l'onglet Statistiques pour construire le graphe d'évolution dans le temps. */
export async function listViewsForAnimalIds(
  supabase: SupabaseClient,
  animalIds: string[]
): Promise<AnimalView[]> {
  if (animalIds.length === 0) return [];
  const { data } = await supabase.from("animal_views").select("*").in("animal_id", animalIds);
  return (data as AnimalView[]) ?? [];
}

// --- Messages (onglet "Messages" de l'espace membre + admin Zoodomo) ---
// Pas de vrai email envoyé nulle part (aucun service configuré en phase mockée) : ces
// messages ne vivent que dans l'app, la bulle de notification non lus est le seul signal.

export async function listAccountMessages(
  supabase: SupabaseClient,
  accountId: string
): Promise<AccountMessage[]> {
  const { data } = await supabase
    .from("account_messages")
    .select("*")
    .eq("account_id", accountId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return (data as AccountMessage[]) ?? [];
}

export async function listArchivedAccountMessages(
  supabase: SupabaseClient,
  accountId: string
): Promise<AccountMessage[]> {
  const { data } = await supabase
    .from("account_messages")
    .select("*")
    .eq("account_id", accountId)
    .eq("status", "archived")
    .order("created_at", { ascending: false });
  return (data as AccountMessage[]) ?? [];
}

export async function listTrashedAccountMessages(
  supabase: SupabaseClient,
  accountId: string
): Promise<AccountMessage[]> {
  const { data } = await supabase
    .from("account_messages")
    .select("*")
    .eq("account_id", accountId)
    .eq("status", "trash")
    .order("created_at", { ascending: false });
  return (data as AccountMessage[]) ?? [];
}

/** Un message archivé ou dans la corbeille ne compte plus dans la bulle non lus : les deux
 * valent "traité". */
export async function countUnreadAccountMessages(
  supabase: SupabaseClient,
  accountId: string
): Promise<number> {
  const { count } = await supabase
    .from("account_messages")
    .select("*", { count: "exact", head: true })
    .eq("account_id", accountId)
    .eq("read", false)
    .eq("status", "active");
  return count ?? 0;
}

/** Évite les doublons pour les messages automatiques (bienvenue, rappel de fiche) : un même
 * évènement (compte, type, éventuellement fiche) n'est jamais envoyé deux fois. Interroge le
 * journal `account_message_log`, pas `account_messages` lui-même : ce dernier peut être vidé
 * par le compte (suppression définitive depuis la corbeille), auquel cas le message
 * redeviendrait "jamais envoyé" et serait régénéré en boucle si on se basait dessus (bug réel
 * rencontré, voir `supabase/migrations/0008_account_message_log.sql` et docs/DECISIONS.md). */
export async function hasAccountMessage(
  supabase: SupabaseClient,
  accountId: string,
  kind: AccountMessageKind,
  animalId: string | null = null
): Promise<boolean> {
  let query = supabase
    .from("account_message_log")
    .select("id", { count: "exact", head: true })
    .eq("account_id", accountId)
    .eq("kind", kind);
  query = animalId === null ? query.is("animal_id", null) : query.eq("animal_id", animalId);
  const { count } = await query;
  return (count ?? 0) > 0;
}

/** À appeler juste après `sendAccountMessage` pour un message automatique (jamais pour un
 * message admin, qui n'a pas de règle "une seule fois") : enregistre définitivement l'envoi
 * dans le journal, indépendamment du sort de la ligne `account_messages` elle-même. */
export async function logAutomaticMessageSent(
  supabase: SupabaseClient,
  accountId: string,
  kind: AccountMessageKind,
  animalId: string | null = null
): Promise<void> {
  await supabase
    .from("account_message_log")
    .insert({ account_id: accountId, kind, animal_id: animalId });
}

export async function sendAccountMessage(
  supabase: SupabaseClient,
  input: {
    account_id: string;
    kind: AccountMessageKind;
    subject: string;
    body: string;
    animal_id?: string | null;
    /** Date à laquelle ce message aurait réellement été envoyé, si différente de maintenant
     * (ex. les échéances de l'essai gratuit, générées rétroactivement au premier accès après
     * plusieurs jours d'absence : sans ce paramètre, "bienvenue" et "dernier jour d'essai"
     * porteraient tous les deux la date du jour, alors qu'ils datent de moments différents),
     * voir `ensureAutomaticMessages` (`src/app/espace/layout.tsx`) et docs/DECISIONS.md. */
    created_at?: string;
  }
): Promise<void> {
  await supabase.from("account_messages").insert({
    account_id: input.account_id,
    kind: input.kind,
    subject: input.subject,
    body: input.body,
    created_at: input.created_at ?? new Date().toISOString(),
    read: false,
    status: "active",
    animal_id: input.animal_id ?? null,
  });
}

/** Bascule manuelle lu/non lu (pas d'auto-lecture à l'ouverture de l'onglet, retiré après un
 * bug : marquer tout comme lu pendant le rendu de la page faisait disparaître le fond orange
 * des messages avant même que le compte ait pu les voir, voir docs/DECISIONS.md). */
export async function setAccountMessageRead(
  supabase: SupabaseClient,
  id: string,
  read: boolean
): Promise<void> {
  await supabase.from("account_messages").update({ read }).eq("id", id);
}

async function setAccountMessageStatus(
  supabase: SupabaseClient,
  id: string,
  status: MessageStatus
): Promise<void> {
  await supabase.from("account_messages").update({ status }).eq("id", id);
}

export async function archiveAccountMessage(supabase: SupabaseClient, id: string): Promise<void> {
  await setAccountMessageStatus(supabase, id, "archived");
}

export async function unarchiveAccountMessage(supabase: SupabaseClient, id: string): Promise<void> {
  await setAccountMessageStatus(supabase, id, "active");
}

/** Suppression douce : passe en corbeille plutôt que de retirer le message tout de suite. */
export async function trashAccountMessage(supabase: SupabaseClient, id: string): Promise<void> {
  await setAccountMessageStatus(supabase, id, "trash");
}

export async function restoreAccountMessageFromTrash(supabase: SupabaseClient, id: string): Promise<void> {
  await setAccountMessageStatus(supabase, id, "active");
}

/** Suppression réelle, uniquement depuis la corbeille. */
export async function deleteAccountMessage(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("account_messages").delete().eq("id", id);
}

/** Messages envoyés par l'admin (diffusions/réponses `kind: "admin"`, et demandes d'avis
 * `kind: "avis_demande"`), tous comptes confondus, pour l'onglet "Envoyés" du panneau admin
 * (`src/app/admin/(protected)/page.tsx`). Nom du compte destinataire résolu via une jointure
 * plutôt qu'une recherche à part. */
export async function listSentAdminMessages(
  supabase: SupabaseClient
): Promise<(AccountMessage & { accountName: string })[]> {
  const { data } = await supabase
    .from("account_messages")
    .select("*, accounts(nom_affichage)")
    .in("kind", ["admin", "avis_demande"])
    .order("created_at", { ascending: false });
  return ((data as (AccountMessage & { accounts: { nom_affichage: string } | null })[]) ?? []).map(
    (m) => ({ ...m, accountName: m.accounts?.nom_affichage ?? "?" })
  );
}

/** Utilisé pour retrouver le message d'origine d'un "Répondre" (le rappeler dans le
 * formulaire de diffusion admin), peu importe son statut actuel. */
export async function getSupportMessageById(
  supabase: SupabaseClient,
  id: string
): Promise<SupportMessage | undefined> {
  const { data } = await supabase.from("support_messages").select("*").eq("id", id).maybeSingle();
  return (data as SupportMessage) ?? undefined;
}

/** Messages envoyés au webmaster par le compte lui-même (onglet "Envoyés" côté pro,
 * `/espace/messages?view=envoyes`), quel que soit leur statut côté admin (actif, archivé,
 * corbeille) : ces statuts sont un concept de traitement admin, pas quelque chose que le pro
 * doit voir disparaître de sa propre liste. Lecture seule, aucune action possible dessus. */
export async function listSupportMessagesSentByAccount(
  supabase: SupabaseClient,
  accountId: string
): Promise<SupportMessage[]> {
  const { data } = await supabase
    .from("support_messages")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  return (data as SupportMessage[]) ?? [];
}

export async function listSupportMessages(supabase: SupabaseClient): Promise<SupportMessage[]> {
  const { data } = await supabase
    .from("support_messages")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return (data as SupportMessage[]) ?? [];
}

export async function listArchivedSupportMessages(supabase: SupabaseClient): Promise<SupportMessage[]> {
  const { data } = await supabase
    .from("support_messages")
    .select("*")
    .eq("status", "archived")
    .order("created_at", { ascending: false });
  return (data as SupportMessage[]) ?? [];
}

export async function listTrashedSupportMessages(supabase: SupabaseClient): Promise<SupportMessage[]> {
  const { data } = await supabase
    .from("support_messages")
    .select("*")
    .eq("status", "trash")
    .order("created_at", { ascending: false });
  return (data as SupportMessage[]) ?? [];
}

/** Recherche tous les messages "contacter le webmaster", peu importe leur statut (boîte de
 * réception, archives ou corbeille) : sur objet, corps, ou nom du compte expéditeur. Utilisée
 * uniquement quand l'admin tape une recherche (`src/app/admin/(protected)/page.tsx`), ignore
 * alors le filtrage habituel par onglet, voir docs/DECISIONS.md. */
export async function searchSupportMessages(
  supabase: SupabaseClient,
  query: string
): Promise<SupportMessage[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const { data } = await supabase
    .from("support_messages")
    .select("*, accounts(nom_affichage)")
    .order("created_at", { ascending: false });
  return ((data as (SupportMessage & { accounts: { nom_affichage: string } | null })[]) ?? []).filter(
    (m) =>
      m.subject.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q) ||
      (m.accounts?.nom_affichage.toLowerCase().includes(q) ?? false)
  );
}

export async function countUnreadSupportMessages(supabase: SupabaseClient): Promise<number> {
  const { count } = await supabase
    .from("support_messages")
    .select("*", { count: "exact", head: true })
    .eq("read", false)
    .eq("status", "active");
  return count ?? 0;
}

async function setSupportMessageStatus(
  supabase: SupabaseClient,
  id: string,
  status: MessageStatus
): Promise<void> {
  await supabase.from("support_messages").update({ status }).eq("id", id);
}

export async function archiveSupportMessage(supabase: SupabaseClient, id: string): Promise<void> {
  await setSupportMessageStatus(supabase, id, "archived");
}

export async function unarchiveSupportMessage(supabase: SupabaseClient, id: string): Promise<void> {
  await setSupportMessageStatus(supabase, id, "active");
}

export async function trashSupportMessage(supabase: SupabaseClient, id: string): Promise<void> {
  await setSupportMessageStatus(supabase, id, "trash");
}

export async function restoreSupportMessageFromTrash(supabase: SupabaseClient, id: string): Promise<void> {
  await setSupportMessageStatus(supabase, id, "active");
}

export async function deleteSupportMessage(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("support_messages").delete().eq("id", id);
}

export async function sendSupportMessage(
  supabase: SupabaseClient,
  input: {
    account_id: string;
    reason: SupportReason;
    subject: string;
    body: string;
    photo_url?: string | null;
  }
): Promise<void> {
  await supabase.from("support_messages").insert({
    account_id: input.account_id,
    reason: input.reason,
    subject: input.subject,
    body: input.body,
    photo_url: input.photo_url ?? null,
    read: false,
    status: "active",
  });
}

/** Même principe que `setAccountMessageRead` : bascule manuelle, pas d'auto-lecture. */
export async function setSupportMessageRead(
  supabase: SupabaseClient,
  id: string,
  read: boolean
): Promise<void> {
  await supabase.from("support_messages").update({ read }).eq("id", id);
}

async function replaceBadges(
  supabase: SupabaseClient,
  animalId: string,
  badges: { type: TypeBadge; label: string }[]
): Promise<void> {
  await supabase.from("animal_badges").delete().eq("animal_id", animalId);
  const rows = badges.map((badge, index) => ({
    animal_id: animalId,
    type: badge.type,
    label: badge.label,
    ordre: index + 1,
  }));
  if (rows.length > 0) await supabase.from("animal_badges").insert(rows);
}

async function replacePhotos(
  supabase: SupabaseClient,
  animalId: string,
  urls: string[]
): Promise<void> {
  const nextSet = new Set(urls.map((u) => u.trim()).filter(Boolean));
  const existing = await listPhotosForAnimalMutable(supabase, animalId);
  await deleteStorageObjects(
    supabase,
    existing.map((p) => p.url).filter((u) => !nextSet.has(u))
  );

  await supabase.from("animal_photos").delete().eq("animal_id", animalId);
  const rows = [...nextSet].map((url, index) => ({ animal_id: animalId, url, ordre: index + 1 }));
  if (rows.length > 0) await supabase.from("animal_photos").insert(rows);
}
