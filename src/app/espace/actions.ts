"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
  type AnimalFormInput,
} from "@/lib/mock";
import { getSessionAccount, SESSION_COOKIE_NAME } from "@/lib/mock/auth";
import { LOCALES, type AccountTheme, type Animal, type Locale, type StatutAnimal } from "@/types";

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/");
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

  const input = parseAnimalForm(formData, account.langues_actives);
  createAnimal(account.id, input);
  revalidatePath("/espace/fiches");
  revalidatePath(`/${account.slug}`);
  redirect("/espace/fiches?saved=created");
}

export async function updateAnimalAction(animalId: string, formData: FormData) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  // Garde-fou côté serveur en plus du contrôle sur la page d'édition : une fiche
  // réservée ou adoptée ne peut pas être modifiée par ce chemin non plus.
  const existing = getAnimalById(animalId);
  if (!existing || existing.account_id !== account.id || existing.statut !== "disponible") {
    redirect("/espace/fiches");
  }

  const input = parseAnimalForm(formData, account.langues_actives);
  updateAnimal(animalId, input);
  revalidatePath("/espace/fiches");
  revalidatePath(`/${account.slug}`);
  redirect("/espace/fiches?saved=updated");
}

export async function deleteAnimalAction(animalId: string) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  deleteAnimal(animalId);
  revalidatePath("/espace/fiches");
  revalidatePath(`/${account.slug}`);
}

export async function changeStatutAction(animalId: string, statut: StatutAnimal) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  changeAnimalStatut(animalId, statut);
  revalidatePath("/espace");
  revalidatePath("/espace/fiches");
  revalidatePath(`/${account.slug}`, "layout");
}

export type SavedState = { saved: boolean; savedAt?: number };

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
  const langues = LOCALES.filter((locale) => formData.get(`langue_${locale}`) === "on");
  const languesActives = langues.length > 0 ? langues : (["fr"] as Locale[]);

  const a_propos: Partial<Record<Locale, string>> = {};
  for (const locale of languesActives) {
    const value = get(`a_propos_${locale}`);
    if (value) a_propos[locale] = value;
  }

  updateAccountInfo(account.id, {
    nom_affichage: get("nom_affichage") || account.nom_affichage,
    contact_email_public: get("contact_email_public"),
    contact_telephone_public: get("contact_telephone_public"),
    adresse: get("adresse"),
    adresse_visible: formData.get("adresse_visible") === "on",
    numero_entreprise: get("numero_entreprise"),
    numero_entreprise_visible: formData.get("numero_entreprise_visible") === "on",
    a_propos,
  });
  updateAccountTheme(account.id, {
    lien_retour_site: get("lien_retour_site"),
  });
  updateAccountLanguesActives(account.id, languesActives);

  const accountPhotoUrls = (get("account_photos") || "")
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);
  replaceAccountPhotos(account.id, accountPhotoUrls);

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

  updateAccountTheme(account.id, {
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
