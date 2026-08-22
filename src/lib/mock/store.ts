import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Account,
  AccountMessage,
  AccountMessageKind,
  AccountPhoto,
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

export async function listAccounts(supabase: SupabaseClient): Promise<Account[]> {
  const { data } = await supabase.from("accounts").select("*");
  return (data as Account[]) ?? [];
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

export async function setAccountPlan(
  supabase: SupabaseClient,
  accountId: string,
  plan: "mensuel" | "annuel"
): Promise<void> {
  await supabase.from("accounts").update({ plan }).eq("id", accountId);
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

export async function replaceAccountPhotos(
  supabase: SupabaseClient,
  accountId: string,
  urls: string[]
): Promise<void> {
  await supabase.from("account_photos").delete().eq("account_id", accountId);
  const rows = urls
    .map((u) => u.trim())
    .filter(Boolean)
    .map((url, index) => ({ account_id: accountId, url, ordre: index + 1 }));
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
  await supabase
    .from("account_theme")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("account_id", accountId);
}

export async function listAnimauxByAccountAll(
  supabase: SupabaseClient,
  accountId: string
): Promise<Animal[]> {
  const { data } = await supabase
    .from("animaux")
    .select("*")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  return (data as Animal[]) ?? [];
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
  // supabase/migrations/0001_init.sql) : pas besoin de les supprimer explicitement ici.
  await supabase.from("animaux").delete().eq("id", id);
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

/** Messages envoyés par l'admin (diffusions/réponses, `kind: "admin"`), tous comptes
 * confondus, pour l'onglet "Envoyés" du panneau admin (`src/app/admin/(protected)/page.tsx`).
 * Nom du compte destinataire résolu via une jointure plutôt qu'une recherche à part. */
export async function listSentAdminMessages(
  supabase: SupabaseClient
): Promise<(AccountMessage & { accountName: string })[]> {
  const { data } = await supabase
    .from("account_messages")
    .select("*, accounts(nom_affichage)")
    .eq("kind", "admin")
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
  await supabase.from("animal_photos").delete().eq("animal_id", animalId);
  const rows = urls
    .map((u) => u.trim())
    .filter(Boolean)
    .map((url, index) => ({ animal_id: animalId, url, ordre: index + 1 }));
  if (rows.length > 0) await supabase.from("animal_photos").insert(rows);
}
