import type { SupabaseClient } from "@supabase/supabase-js";
import type { Account, Animal, Locale } from "@/types";
import { mockEspeces } from "./especes";
import {
  listAnimauxByAccountAll,
  listBadgesForAnimalMutable,
  listPhotosForAnimalMutable,
  listAccountPhotosMutable,
  getAccountThemeMutable,
  countViewsForAnimal,
} from "./store";

export async function getViewCount(supabase: SupabaseClient, animalId: string): Promise<number> {
  return countViewsForAnimal(supabase, animalId);
}

/** Durée de l'essai gratuit en jours, à partir de l'inscription (`Account.created_at`). */
export const TRIAL_DAYS = 15;

/** Jours restants d'essai gratuit, calculés à la volée à partir de `created_at` (jamais
 * stockés/décrémentés) pour ne jamais dériver, même si le serveur redémarre entre-temps.
 * `0` le dernier jour encore gratuit, négatif une fois l'essai expiré. Sans objet (retourne
 * `null`) pour un compte qui n'est plus en essai (`plan !== "essai"`). */
export function trialDaysRemaining(account: Account): number | null {
  if (account.plan !== "essai") return null;
  const elapsedDays = (Date.now() - new Date(account.created_at).getTime()) / 86_400_000;
  return Math.ceil(TRIAL_DAYS - elapsedDays);
}

export function isTrialExpired(account: Account): boolean {
  const remaining = trialDaysRemaining(account);
  return remaining !== null && remaining < 0;
}

/** `true` si l'abonnement Paddle du compte est dans un état qui donne réellement accès au
 * service. `past_due` (paiement échoué, Paddle retente automatiquement sur 30 jours)
 * **volontairement exclu** malgré la recommandation par défaut de la compétence d'agent
 * `paddle-subscription-sync` (qui suggère de garder l'accès pendant cette fenêtre) : décision
 * utilisateur explicite (2026-08-24), accès coupé dès le premier échec plutôt que d'attendre
 * l'issue des relances. */
export function hasActivePaddleSubscription(account: Account): boolean {
  return account.paddle_subscription_status === "active" || account.paddle_subscription_status === "trialing";
}

export type PlanPopupReason = "trial_ended" | "payment_failed" | "canceled";

/** Raison pour laquelle le popup de choix de plan (`PlanPopup.tsx`) doit être affiché de
 * façon obligatoire, `null` si l'accès est normal. Détermine à la fois si le popup s'affiche
 * (`needsPlanChoice`) et son contenu exact : "essai terminé" propose un choix de plan (aucun
 * abonnement n'a jamais existé), "paiement échoué" redirige vers le portail client Paddle
 * pour mettre à jour le moyen de paiement de l'abonnement existant (pas un nouveau checkout,
 * qui créerait un second abonnement en double), "résilié/en pause" propose de nouveau un
 * choix de plan (plus d'abonnement existant à réparer). */
export function planPopupReason(account: Account): PlanPopupReason | null {
  if (account.plan === "essai") return isTrialExpired(account) ? "trial_ended" : null;
  if (hasActivePaddleSubscription(account)) return null;
  return account.paddle_subscription_status === "past_due" ? "payment_failed" : "canceled";
}

export function needsPlanChoice(account: Account): boolean {
  return planPopupReason(account) !== null;
}

/** Délai de grâce après la fin de l'essai gratuit (ou après qu'un abonnement payant cesse
 * d'être actif) pendant lequel la page publique reste visible malgré tout (laisse le temps
 * de voir le popup obligatoire et de régulariser sans que la page ne disparaisse
 * brutalement, ex. un week-end). */
export const GRACE_HOURS = 48;

/** `true` une fois l'essai ET le délai de grâce épuisés pour un compte resté en `"essai"`, OU
 * une fois le même délai de grâce épuisé depuis qu'un abonnement payant a cessé d'être actif
 * (`paddle_subscription_status_changed_at`, mis à jour par le webhook uniquement quand le
 * statut change réellement, voir `src/lib/mock/store.ts`) : dans les deux cas, les pages
 * publiques (`/[compte]/...`) doivent alors afficher un message d'indisponibilité plutôt que
 * leur contenu normal, voir `src/app/[compte]/layout.tsx`. Contrairement à l'accès dashboard
 * (`needsPlanChoice`, coupé immédiatement), la page publique bénéficie toujours de ce délai,
 * décision utilisateur du 2026-08-24 reprenant le mécanisme déjà en place pour l'essai. */
export function isPublicPageBlocked(account: Account): boolean {
  if (account.plan === "essai") {
    const elapsedDays = (Date.now() - new Date(account.created_at).getTime()) / 86_400_000;
    return elapsedDays > TRIAL_DAYS + GRACE_HOURS / 24;
  }
  if (hasActivePaddleSubscription(account) || !account.paddle_subscription_status_changed_at) return false;
  const elapsedHours =
    (Date.now() - new Date(account.paddle_subscription_status_changed_at).getTime()) / 3_600_000;
  return elapsedHours > GRACE_HOURS;
}

/** Nombre de jours sans modification à partir duquel une fiche "disponible" est considérée
 * comme potentiellement obsolète (rappel automatique dans l'onglet Messages). */
export const STALE_FICHE_DAYS = 30;

export async function getStaleFichesDisponibles(
  supabase: SupabaseClient,
  accountId: string,
  thresholdDays: number = STALE_FICHE_DAYS
): Promise<Animal[]> {
  const animaux = await listAnimauxByAccountAll(supabase, accountId);
  return animaux.filter((a) => {
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

export async function getAccountBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Account | undefined> {
  const { data } = await supabase.from("accounts").select("*").eq("slug", slug).maybeSingle();
  return (data as Account) ?? undefined;
}

export async function getAccountTheme(supabase: SupabaseClient, accountId: string) {
  return getAccountThemeMutable(supabase, accountId);
}

export async function getAccountPhotos(supabase: SupabaseClient, accountId: string) {
  return listAccountPhotosMutable(supabase, accountId);
}

export function getEspeceBySlug(slug: string) {
  return mockEspeces.find((e) => e.slug === slug);
}

export function getEspeceById(id: string) {
  return mockEspeces.find((e) => e.id === id);
}

/** Espèces pour lesquelles ce compte a au moins un animal visible publiquement, triées comme le référentiel global. */
export async function getEspecesAvecAnimauxVisibles(supabase: SupabaseClient, accountId: string) {
  const animaux = await listAnimauxByAccountAll(supabase, accountId);
  const especeIds = new Set(animaux.filter(isAnimalVisiblePublicly).map((a) => a.espece_id));
  return mockEspeces.filter((e) => especeIds.has(e.id)).sort((a, b) => a.ordre - b.ordre);
}

export async function getAnimauxVisibles(supabase: SupabaseClient, accountId: string, especeId: string) {
  const animaux = await listAnimauxByAccountAll(supabase, accountId);
  return animaux.filter((a) => a.espece_id === especeId && isAnimalVisiblePublicly(a));
}

export async function getAnimalVisibleBySlug(
  supabase: SupabaseClient,
  accountId: string,
  especeId: string,
  slug: string
): Promise<Animal | undefined> {
  const animaux = await listAnimauxByAccountAll(supabase, accountId);
  return animaux.find(
    (a) => a.espece_id === especeId && a.slug === slug && isAnimalVisiblePublicly(a)
  );
}

export async function getBadgesForAnimal(supabase: SupabaseClient, animalId: string) {
  return listBadgesForAnimalMutable(supabase, animalId);
}

export async function getPhotosForAnimal(supabase: SupabaseClient, animalId: string) {
  return listPhotosForAnimalMutable(supabase, animalId);
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

/** Renvoie une clé de traduction (namespace "animal") plutôt qu'un texte, résolue à l'affichage.
 * Fonction pure : appelée aussi depuis des composants `"use client"` (panneau de
 * visualisation, voir `src/components/preview/`), reste volontairement synchrone et sans
 * client Supabase. */
export function getSexeLabelKey(animal: Animal): SexeLabelKey | null {
  if (!animal.sexe) return null;
  if (animal.sterilise === null) return animal.sexe === "male" ? "male" : "female";
  if (animal.sexe === "male") return animal.sterilise ? "maleNeutered" : "maleNotNeutered";
  return animal.sterilise ? "femaleNeutered" : "femaleNotNeutered";
}

/**
 * Résout un champ multilingue (description, foyer idéal) dans la langue demandée,
 * avec repli sur les autres langues actives du compte si la traduction manque. Fonction
 * pure, mêmes raisons que `getSexeLabelKey` ci-dessus.
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
 * sienne (ex. compte qui n'écrit qu'en français, visiteur en néerlandais). Fonction pure,
 * mêmes raisons que `getSexeLabelKey` ci-dessus.
 */
export function localesWithContent(
  value: Partial<Record<Locale, string>> | null | undefined
): Locale[] {
  if (!value) return [];
  return (Object.keys(value) as Locale[]).filter((l) => value[l]);
}
