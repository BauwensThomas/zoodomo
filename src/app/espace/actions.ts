"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  createAnimal,
  updateAnimal,
  deleteAnimal,
  changeAnimalStatut,
  updateAccountLanguesActives,
  updateAccountInfo,
  updateAccountTheme,
  replaceAccountPhotos,
  getAnimalById,
  archiveAccountMessage,
  unarchiveAccountMessage,
  trashAccountMessage,
  restoreAccountMessageFromTrash,
  deleteAccountMessage,
  setAccountMessageRead,
  sendSupportMessage,
  type AnimalFormInput,
} from "@/lib/mock";
import { getSessionAccount } from "@/lib/mock/auth";
import { createClient } from "@/lib/supabase/server";
import { getPaddleInstance } from "@/lib/paddle/server";
import type { CustomerPortalSession } from "@paddle/paddle-node-sdk";
import { sendEmail } from "@/lib/email/resend";
import { renderEmailHtml } from "@/lib/email/template";
import {
  LOCALES,
  type AccountTheme,
  type Animal,
  type Locale,
  type StatutAnimal,
  type SupportReason,
} from "@/types";

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Mint une session de portail client Paddle pour le compte connecté. `customerId`/
 * `subscriptionId` viennent uniquement de la session du compte connecté, jamais d'un
 * paramètre client, pour ne jamais pouvoir minter un lien vers l'abonnement de quelqu'un
 * d'autre (voir la compétence d'agent `paddle-customer-portal`). Le lien est à usage unique
 * et expire rapidement : jamais mis en cache, une session par clic. */
async function createPortalSession(): Promise<{ session: CustomerPortalSession } | { error: string }> {
  const account = await getSessionAccount();
  if (!account) return { error: "not_authenticated" };
  if (!account.paddle_customer_id || !account.paddle_subscription_id) {
    return { error: "no_subscription" };
  }

  const paddle = getPaddleInstance();
  const session = await paddle.customerPortalSessions.create(account.paddle_customer_id, [
    account.paddle_subscription_id,
  ]);
  return { session };
}

/** Lien direct vers l'écran de mise à jour du moyen de paiement (affiché depuis
 * `PlanPopup.tsx` quand `planPopupReason === "payment_failed"`, voir docs/DECISIONS.md). */
export async function createUpdatePaymentMethodSessionAction(): Promise<
  { url: string } | { error: string }
> {
  const result = await createPortalSession();
  if ("error" in result) return result;
  const url =
    result.session.urls.subscriptions[0]?.updateSubscriptionPaymentMethod ??
    result.session.urls.general.overview;
  return { url };
}

/** Vue d'ensemble du portail (factures, changer de carte, résilier) : "Gérer mon
 * abonnement" dans l'onglet Compte. Paddle gère nativement la résiliation "à la fin de la
 * période" (le pro garde l'accès jusqu'à la date déjà payée, voir docs/DECISIONS.md) et, tant
 * que cette résiliation programmée n'a pas encore pris effet, permet de l'annuler depuis
 * cette même page, sans logique personnalisée à recoder ici. */
export async function createManageSubscriptionSessionAction(): Promise<
  { url: string } | { error: string }
> {
  const result = await createPortalSession();
  if ("error" in result) return result;
  return { url: result.session.urls.general.overview };
}
function parseAnimalForm(formData: FormData, languesActives: Locale[]): AnimalFormInput {
  const get = (name: string): string | null => {
    const value = formData.get(name);
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };
  const numberOrNull = (v: string | null) => (v !== null ? Number(v) : null);

  const description: Partial<Record<Locale, string>> = {};
  const foyer_ideal: Partial<Record<Locale, string>> = {};
  for (const locale of languesActives) {
    const d = get(`description_${locale}`);
    if (d) description[locale] = d;
    const f = get(`foyer_ideal_${locale}`);
    if (f) foyer_ideal[locale] = f;
  }

  // Un seul badge par fiche, texte libre : pas de type à choisir, pas de case à cocher.
  // Texte vide = pas de badge (le badge est une petite carte affichée dans le coin de la
  // photo publique, voir PhotoCarousel).
  const badgeLabel = get("badge_label");
  const badges = badgeLabel ? [{ type: "autre" as const, label: badgeLabel }] : [];

  const steriliseRaw = get("sterilise");
  const photoUrls = (get("photos") || "")
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  return {
    nom: get("nom") || "Sans nom",
    espece_id: get("espece_id") || "",
    race: get("race"),
    sexe: (get("sexe") as Animal["sexe"] | null) ?? null,
    sterilise: steriliseRaw === null ? null : steriliseRaw === "true",
    annee_naissance: numberOrNull(get("annee_naissance")),
    date_naissance: get("date_naissance"),
    numero_identification: get("numero_identification"),
    date_arrivee: get("date_arrivee"),
    origine: get("origine"),
    description,
    foyer_ideal,
    prix: numberOrNull(get("prix")),
    statut: (get("statut") as Animal["statut"] | null) || "disponible",
    contact_email: get("contact_email"),
    contact_telephone: get("contact_telephone"),
    badges,
    photoUrls,
  };
}

export async function createAnimalAction(formData: FormData) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const supabase = await createClient();
  const input = parseAnimalForm(formData, account.langues_actives);
  await createAnimal(supabase, account.id, input);
  revalidatePath("/espace/fiches");
  revalidatePath(`/${account.slug}`);
  redirect("/espace/fiches?saved=created");
}

export async function updateAnimalAction(animalId: string, formData: FormData) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const supabase = await createClient();
  // Garde-fou côté serveur en plus du contrôle sur la page d'édition : une fiche
  // réservée ou adoptée ne peut pas être modifiée par ce chemin non plus.
  const existing = await getAnimalById(supabase, animalId);
  if (!existing || existing.account_id !== account.id || existing.statut !== "disponible") {
    redirect("/espace/fiches");
  }

  const input = parseAnimalForm(formData, account.langues_actives);
  await updateAnimal(supabase, animalId, input);
  revalidatePath("/espace/fiches");
  revalidatePath(`/${account.slug}`);
  redirect("/espace/fiches?saved=updated");
}

export async function deleteAnimalAction(animalId: string) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const supabase = await createClient();
  await deleteAnimal(supabase, animalId);
  revalidatePath("/espace/fiches");
  revalidatePath(`/${account.slug}`);
}

export async function changeStatutAction(animalId: string, statut: StatutAnimal) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const supabase = await createClient();
  await changeAnimalStatut(supabase, animalId, statut);
  revalidatePath("/espace");
  revalidatePath("/espace/fiches");
  revalidatePath(`/${account.slug}`, "layout");
}

export type SavedState = { saved: boolean; savedAt?: number; error?: string };

/**
 * Une seule action pour toute la page Compte (Informations, Informations légales, Site
 * web, Langues) : un unique bouton "Enregistrer" en bas de page, sur le même principe que
 * le formulaire de fiche animal, plutôt qu'un bouton par section.
 *
 * Ne redirige plus vers elle-même (`?saved=1`) une fois enregistrée : ce formulaire est
 * long, et une redirection façon navigation remonte le visiteur en haut de page à chaque
 * clic sur "Enregistrer", même s'il vient de cliquer tout en bas (signalé par
 * l'utilisateur). `useActionState` côté client permet d'afficher la confirmation sans
 * navigation, la mise à jour visible sur la page passe uniquement par `revalidatePath`.
 */
export async function updateAccountAction(
  _prevState: SavedState,
  formData: FormData
): Promise<SavedState> {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const get = (name: string): string | null => {
    const value = formData.get(name);
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  // La liste des langues actives soumises fait référence pour filtrer `a_propos` : une
  // langue décochée ne doit pas garder son texte, même si son champ était encore présent
  // dans le formulaire soumis (défense en profondeur, en plus de la réactivité côté
  // client dans LanguesPresentationSection.tsx).
  const contactEmailPublic = get("contact_email_public");
  const contactTelephonePublic = get("contact_telephone_public");
  // Sans formulaire de contact de secours (décision utilisateur, voir docs/DECISIONS.md),
  // le lien tel:/mailto: direct est le seul moyen de contacter le compte depuis une fiche
  // animal : au moins l'un des deux doit être renseigné, sinon aucune fiche n'est joignable.
  if (!contactEmailPublic && !contactTelephonePublic) {
    const t = await getTranslations("admin.compte");
    return { saved: false, error: t("contactRequiredError") };
  }

  const langues = LOCALES.filter((locale) => formData.get(`langue_${locale}`) === "on");
  const languesActives = langues.length > 0 ? langues : (["fr"] as Locale[]);

  const a_propos: Partial<Record<Locale, string>> = {};
  for (const locale of languesActives) {
    const value = get(`a_propos_${locale}`);
    if (value) a_propos[locale] = value;
  }

  const supabase = await createClient();
  await updateAccountInfo(supabase, account.id, {
    nom_affichage: get("nom_affichage") || account.nom_affichage,
    contact_email_public: contactEmailPublic,
    contact_telephone_public: contactTelephonePublic,
    adresse: get("adresse"),
    adresse_visible: formData.get("adresse_visible") === "on",
    numero_entreprise: get("numero_entreprise"),
    numero_entreprise_visible: formData.get("numero_entreprise_visible") === "on",
    a_propos,
  });
  await updateAccountTheme(supabase, account.id, {
    lien_retour_site: get("lien_retour_site"),
  });
  await updateAccountLanguesActives(supabase, account.id, languesActives);

  const accountPhotoUrls = (get("account_photos") || "")
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);
  await replaceAccountPhotos(supabase, account.id, accountPhotoUrls);

  revalidatePath("/espace/compte");
  revalidatePath("/espace", "layout");
  revalidatePath(`/${account.slug}`, "layout");
  return { saved: true, savedAt: Date.now() };
}

/** Même principe que `updateAccountAction` : pas de redirection vers elle-même. */
export async function updatePersonnalisationAction(
  _prevState: SavedState,
  formData: FormData
): Promise<SavedState> {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const get = (name: string): string | null => {
    const value = formData.get(name);
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const logoPhotos = (get("logo") || "").split("\n").map((u) => u.trim()).filter(Boolean);

  const supabase = await createClient();
  await updateAccountTheme(supabase, account.id, {
    police: get("police") || "default",
    couleur_primaire: get("couleur_primaire") || "#221c16",
    couleur_secondaire: get("couleur_secondaire") || "#efe9e0",
    disposition_photos: (get("disposition_photos") as AccountTheme["disposition_photos"]) || "grille",
    disposition_especes: (get("disposition_especes") as AccountTheme["disposition_especes"]) || "liste",
    disposition_presentation:
      (get("disposition_presentation") as AccountTheme["disposition_presentation"]) || "photo_texte",
    logo_url: logoPhotos[0] ?? null,
  });

  revalidatePath("/espace/personnalisation");
  revalidatePath("/espace", "layout");
  revalidatePath(`/${account.slug}`, "layout");
  return { saved: true, savedAt: Date.now() };
}

/** Suppression douce : passe en corbeille, pas de perte immédiate. */
export async function trashMessageAction(messageId: string) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const supabase = await createClient();
  await trashAccountMessage(supabase, messageId);
  revalidatePath("/espace/messages");
  revalidatePath("/espace", "layout");
}

export async function restoreMessageAction(messageId: string) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const supabase = await createClient();
  await restoreAccountMessageFromTrash(supabase, messageId);
  revalidatePath("/espace/messages");
  revalidatePath("/espace", "layout");
}

/** Suppression réelle et définitive, uniquement possible depuis la corbeille. */
export async function deleteMessageAction(messageId: string) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const supabase = await createClient();
  await deleteAccountMessage(supabase, messageId);
  revalidatePath("/espace/messages");
  revalidatePath("/espace", "layout");
}

export async function archiveMessageAction(messageId: string) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const supabase = await createClient();
  await archiveAccountMessage(supabase, messageId);
  revalidatePath("/espace/messages");
  revalidatePath("/espace", "layout");
}

export async function unarchiveMessageAction(messageId: string) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const supabase = await createClient();
  await unarchiveAccountMessage(supabase, messageId);
  revalidatePath("/espace/messages");
  revalidatePath("/espace", "layout");
}

export async function setMessageReadAction(messageId: string, read: boolean) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const supabase = await createClient();
  await setAccountMessageRead(supabase, messageId, read);
  revalidatePath("/espace/messages");
  revalidatePath("/espace", "layout");
}

const SUPPORT_REASONS: SupportReason[] = ["bug", "compte", "suggestion", "autre"];

/** "Contacter le webmaster" depuis l'onglet Messages : raison présélectionnée
 * (questionnaire) plutôt qu'un objet libre, voir docs/DECISIONS.md. */
export async function sendSupportMessageAction(
  _prevState: SavedState,
  formData: FormData
): Promise<SavedState> {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const reasonRaw = String(formData.get("reason") || "");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const photoUrl = String(formData.get("photo") || "").trim();
  const reason = SUPPORT_REASONS.includes(reasonRaw as SupportReason)
    ? (reasonRaw as SupportReason)
    : "autre";

  if (!subject || !body) {
    const t = await getTranslations("admin.messages");
    return { saved: false, error: t("contactRequiredError") };
  }

  const supabase = await createClient();
  await sendSupportMessage(supabase, {
    account_id: account.id,
    reason,
    subject,
    body,
    photo_url: photoUrl || null,
  });

  // Email à l'admin en français, comme le reste du panneau admin (pas de langue par
  // utilisateur côté équipe interne), indépendamment de la langue du compte expéditeur.
  const tAdmin = await getTranslations({ locale: "fr", namespace: "admin.messages" });
  const reasonLabel = tAdmin(
    reason === "bug"
      ? "contactReasonBug"
      : reason === "compte"
        ? "contactReasonCompte"
        : reason === "suggestion"
          ? "contactReasonSuggestion"
          : "contactReasonAutre"
  );
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  await sendEmail({
    to: process.env.ZOODOMO_ADMIN_EMAIL!,
    subject: `[Zoodomo] Nouveau message : ${subject}`,
    html: renderEmailHtml({
      title: "Nouveau message via Contacter le webmaster",
      body: [
        `De : ${account.nom_affichage} (${account.email})`,
        `Raison : ${reasonLabel}`,
        `Objet : ${subject}`,
        "",
        body,
        photoUrl ? "\nUne capture d'écran a été jointe, consultable dans le panneau admin." : "",
      ].join("\n"),
      buttonLabel: "Ouvrir le panneau admin",
      buttonUrl: `${protocol}://${host}/admin`,
    }),
  });

  revalidatePath("/espace/messages");
  return { saved: true, savedAt: Date.now() };
}
