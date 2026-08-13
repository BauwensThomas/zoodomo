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
  type AnimalFormInput,
} from "@/lib/mock";
import { getSessionAccount, SESSION_COOKIE_NAME } from "@/lib/mock/auth";
import { LOCALES, type Animal, type Locale, type StatutAnimal } from "@/types";

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
  redirect("/espace/fiches");
}

export async function updateAnimalAction(animalId: string, formData: FormData) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const input = parseAnimalForm(formData, account.langues_actives);
  updateAnimal(animalId, input);
  revalidatePath("/espace/fiches");
  revalidatePath(`/${account.slug}`);
  redirect("/espace/fiches");
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

export async function updateLanguesActivesAction(formData: FormData) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const langues = LOCALES.filter((locale) => formData.get(`langue_${locale}`) === "on");
  updateAccountLanguesActives(account.id, langues.length > 0 ? langues : ["fr"]);
  revalidatePath("/espace/compte");
  revalidatePath(`/${account.slug}`);
}

export async function updateAccountInfoAction(formData: FormData) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const get = (name: string): string | null => {
    const value = formData.get(name);
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  updateAccountInfo(account.id, {
    nom_affichage: get("nom_affichage") || account.nom_affichage,
    contact_email_public: get("contact_email_public"),
    contact_telephone_public: get("contact_telephone_public"),
  });
  revalidatePath("/espace/compte");
  revalidatePath("/espace", "layout");
  revalidatePath(`/${account.slug}`);
}
