import type { Account, Animal, Locale } from "@/types";
import { mockEspeces } from "./especes";
import {
  listAccounts,
  listAnimauxByAccountAll,
  listBadgesForAnimalMutable,
  listPhotosForAnimalMutable,
  listAccountPhotosMutable,
  getAccountThemeMutable,
  countViewsForAnimal,
} from "./store";

export function getViewCount(animalId: string) {
  return countViewsForAnimal(animalId);
}

/** Nombre de jours sans modification à partir duquel une fiche "disponible" est considérée
 * comme potentiellement obsolète (rappel automatique dans l'onglet Messages). */
export const STALE_FICHE_DAYS = 30;

export function getStaleFichesDisponibles(accountId: string, thresholdDays: number = STALE_FICHE_DAYS) {
  return listAnimauxByAccountAll(accountId).filter((a) => {
    if (a.statut !== "disponible") return false;
    const elapsedDays = (Date.now() - new Date(a.updated_at).getTime()) / 86_400_000;
    return elapsedDays >= thresholdDays;
  });
}

/**
 * Nombre de jours pendant lesquels une fiche "adoptée" reste visible sur les pages
 * publiques (avec la mention "Adopté" en grand sur la photo) avant de disparaître
 * automatiquement des galeries, sans action manuelle de l'utilisateur.
 */
export const ADOPTED_VISIBILITY_DAYS = 7;

/**
 * Le statut est la seule chose qui pilote la visibilité publique d'une fiche (pas de
 * champ "publiée/brouillon" séparé, écart assumé par rapport au brief section 3/9 : une
 * fiche créée est visible immédiatement). "disponible" et "réservé" restent toujours
 * visibles ; "adopté" reste visible `ADOPTED_VISIBILITY_DAYS` jours après `date_adoption`,
 * calculé à chaque affichage (pas de tâche planifiée nécessaire en phase mockée).
 */
export function isAnimalVisiblePublicly(animal: Animal): boolean {
  if (animal.statut !== "adopte") return true;
  return (joursVisibiliteRestants(animal) ?? -1) >= 0;
}

/**
 * Jours restants avant qu'une fiche "adoptée" ne disparaisse des pages publiques (0 le
 * dernier jour où elle est encore visible, négatif une fois la fenêtre passée : la fiche
 * reste dans "Mes fiches"/le dashboard, seule la visibilité publique change), `null` si la
 * fiche n'est pas concernée (statut différent de "adopté"). Volontairement pas remis à
 * zéro/positif après expiration, pour distinguer "dernier jour visible" de "déjà retiré
 * des pages publiques" dans l'affichage (voir `src/app/espace/fiches/page.tsx`).
 */
export function joursVisibiliteRestants(animal: Animal): number | null {
  if (animal.statut !== "adopte" || !animal.date_adoption) return null;
  const elapsedDays = (Date.now() - new Date(animal.date_adoption).getTime()) / 86_400_000;
  return Math.ceil(ADOPTED_VISIBILITY_DAYS - elapsedDays);
}

export type VisibiliteResult =
  | { state: "days"; days: number }
  | { state: "lastDay" }
  | { state: "expired" }
  | { state: null };

/**
 * Traduit `joursVisibiliteRestants` en état d'affichage pour l'espace membre : "days" (encore
 * N jours), "lastDay" (dernier jour, encore visible aujourd'hui), "expired" (fenêtre passée,
 * déjà retirée des pages publiques mais reste dans la liste des fiches adoptées), ou `null`
 * si la fiche n'est pas concernée.
 */
export function visibiliteState(animal: Animal): VisibiliteResult {
  const jours = joursVisibiliteRestants(animal);
  if (jours === null) return { state: null };
  if (jours > 0) return { state: "days", days: jours };
  if (jours === 0) return { state: "lastDay" };
  return { state: "expired" };
}

export function getAccountBySlug(slug: string) {
  return listAccounts().find((a) => a.slug === slug);
}

export function getAccountTheme(accountId: string) {
  return getAccountThemeMutable(accountId);
}

export function getAccountPhotos(accountId: string) {
  return listAccountPhotosMutable(accountId);
}

export function getEspeceBySlug(slug: string) {
  return mockEspeces.find((e) => e.slug === slug);
}

export function getEspeceById(id: string) {
  return mockEspeces.find((e) => e.id === id);
}

/** Espèces pour lesquelles ce compte a au moins un animal visible publiquement, triées comme le référentiel global. */
export function getEspecesAvecAnimauxVisibles(accountId: string) {
  const especeIds = new Set(
    listAnimauxByAccountAll(accountId)
      .filter(isAnimalVisiblePublicly)
      .map((a) => a.espece_id)
  );
  return mockEspeces
    .filter((e) => especeIds.has(e.id))
    .sort((a, b) => a.ordre - b.ordre);
}

export function getAnimauxVisibles(accountId: string, especeId: string) {
  return listAnimauxByAccountAll(accountId).filter(
    (a) => a.espece_id === especeId && isAnimalVisiblePublicly(a)
  );
}

export function getAnimalVisibleBySlug(
  accountId: string,
  especeId: string,
  slug: string
): Animal | undefined {
  return listAnimauxByAccountAll(accountId).find(
    (a) => a.espece_id === especeId && a.slug === slug && isAnimalVisiblePublicly(a)
  );
}

export function getBadgesForAnimal(animalId: string) {
  return listBadgesForAnimalMutable(animalId);
}

export function getPhotosForAnimal(animalId: string) {
  return listPhotosForAnimalMutable(animalId);
}

/**
 * Contact à afficher sur la fiche : priorité au contact spécifique de l'animal,
 * sinon fallback sur le contact générique du compte (brief section 3).
 */
export function resolveContact(animal: Animal, account: Account) {
  return {
    email: animal.contact_email ?? account.contact_email_public,
    telephone: animal.contact_telephone ?? account.contact_telephone_public,
  };
}

export type SexeLabelKey =
  | "male"
  | "female"
  | "maleNeutered"
  | "maleNotNeutered"
  | "femaleNeutered"
  | "femaleNotNeutered";

/** Renvoie une clé de traduction (namespace "animal") plutôt qu'un texte, résolue à l'affichage. */
export function getSexeLabelKey(animal: Animal): SexeLabelKey | null {
  if (!animal.sexe) return null;
  if (animal.sterilise === null) return animal.sexe === "male" ? "male" : "female";
  if (animal.sexe === "male") return animal.sterilise ? "maleNeutered" : "maleNotNeutered";
  return animal.sterilise ? "femaleNeutered" : "femaleNotNeutered";
}

/**
 * Résout un champ multilingue (description, foyer idéal) dans la langue demandée,
 * avec repli sur les autres langues actives du compte si la traduction manque.
 */
export function pickLocalized(
  value: Partial<Record<Locale, string>> | null | undefined,
  locale: Locale,
  fallbacks: Locale[] = ["fr", "nl", "en"]
): string | null {
  if (!value) return null;
  if (value[locale]) return value[locale] as string;
  for (const fallback of fallbacks) {
    if (value[fallback]) return value[fallback] as string;
  }
  return null;
}

/**
 * Langues pour lesquelles un champ multilingue (description, foyer idéal) a du contenu.
 * Sert à avertir le visiteur quand `pickLocalized` retombe sur une autre langue que la
 * sienne (ex. compte qui n'écrit qu'en français, visiteur en néerlandais).
 */
export function localesWithContent(
  value: Partial<Record<Locale, string>> | null | undefined
): Locale[] {
  if (!value) return [];
  return (Object.keys(value) as Locale[]).filter((l) => value[l]);
}
