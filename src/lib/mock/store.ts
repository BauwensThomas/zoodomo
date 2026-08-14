import type {
  Account,
  AccountPhoto,
  AccountTheme,
  Animal,
  AnimalBadge,
  AnimalPhoto,
  Locale,
  StatutAnimal,
  TypeBadge,
} from "@/types";
import { mockAccounts, mockAccountThemes, mockAccountPhotos } from "./accounts";
import { mockAnimaux, mockAnimalBadges, mockAnimalPhotos } from "./animaux";
import { slugify } from "@/lib/slugify";

/**
 * Store en mémoire, mutable, pour simuler un backend le temps de rester en phase mockée
 * (voir méthode de travail, docs/DECISIONS.md). Remis à zéro à chaque redémarrage du
 * serveur de dev, remplacé par de vraies requêtes Supabase plus tard.
 */
let accounts: Account[] = [...mockAccounts];
let accountThemes: AccountTheme[] = [...mockAccountThemes];
let accountPhotos: AccountPhoto[] = [...mockAccountPhotos];
let animaux: Animal[] = [...mockAnimaux];
let animalBadges: AnimalBadge[] = [...mockAnimalBadges];
let animalPhotos: AnimalPhoto[] = [...mockAnimalPhotos];

export function listAccounts() {
  return accounts;
}

export function getAccountByIdMutable(id: string) {
  return accounts.find((a) => a.id === id);
}

export function updateAccountLanguesActives(accountId: string, langues: Locale[]) {
  accounts = accounts.map((a) =>
    a.id === accountId ? { ...a, langues_actives: langues } : a
  );
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

export function updateAccountInfo(accountId: string, input: AccountInfoInput) {
  accounts = accounts.map((a) => (a.id === accountId ? { ...a, ...input } : a));
}

export function listAccountPhotosMutable(accountId: string) {
  return accountPhotos.filter((p) => p.account_id === accountId).sort((a, b) => a.ordre - b.ordre);
}

export function replaceAccountPhotos(accountId: string, urls: string[]) {
  accountPhotos = accountPhotos.filter((p) => p.account_id !== accountId);
  urls
    .map((u) => u.trim())
    .filter(Boolean)
    .forEach((url, index) => {
      accountPhotos.push({
        id: `account-photo-${accountId}-${index}`,
        account_id: accountId,
        url,
        ordre: index + 1,
        created_at: new Date().toISOString(),
      });
    });
}

export function getAccountThemeMutable(accountId: string) {
  return accountThemes.find((t) => t.account_id === accountId);
}

export function updateAccountTheme(
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
) {
  accountThemes = accountThemes.map((t) =>
    t.account_id === accountId ? { ...t, ...input, updated_at: new Date().toISOString() } : t
  );
}

function uniqueAccountSlug(base: string) {
  const root = slugify(base) || "compte";
  let slug = root;
  let i = 2;
  while (accounts.some((a) => a.slug === slug)) {
    slug = `${root}-${i++}`;
  }
  return slug;
}

export function createAccount(input: { nom_affichage: string; email: string }): Account {
  const account: Account = {
    id: `account-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    email: input.email,
    nom_affichage: input.nom_affichage,
    slug: uniqueAccountSlug(input.nom_affichage),
    contact_email_public: input.email,
    contact_telephone_public: null,
    adresse: null,
    adresse_visible: true,
    numero_entreprise: null,
    numero_entreprise_visible: true,
    a_propos: {},
    langues_actives: ["fr"],
    created_at: new Date().toISOString(),
  };
  accounts = [...accounts, account];
  accountThemes = [
    ...accountThemes,
    {
      account_id: account.id,
      police: "default",
      couleur_primaire: "#2f6b4f",
      couleur_secondaire: "#f4f1ea",
      disposition_photos: "grille",
      disposition_especes: "liste",
      disposition_presentation: "photo_texte",
      logo_url: null,
      lien_retour_site: null,
      updated_at: account.created_at,
    },
  ];
  return account;
}

export function listAnimauxByAccountAll(accountId: string) {
  return animaux
    .filter((a) => a.account_id === accountId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getAnimalById(id: string) {
  return animaux.find((a) => a.id === id);
}

/**
 * Date d'entrée dans un statut donné ("réservé" ou "adopté"), gérée automatiquement au
 * changement de statut, jamais saisie à la main : fixée au moment où le statut cible est
 * atteint, effacée si l'animal en repart. Factorisé car `date_reservation` suit exactement
 * la même règle que `date_adoption`, juste pour un statut différent.
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

function uniqueSlug(accountId: string, base: string, excludeId?: string) {
  const root = slugify(base) || "animal";
  let slug = root;
  let i = 2;
  while (
    animaux.some(
      (a) => a.account_id === accountId && a.slug === slug && a.id !== excludeId
    )
  ) {
    slug = `${root}-${i++}`;
  }
  return slug;
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

export function createAnimal(accountId: string, input: AnimalFormInput): Animal {
  const now = new Date().toISOString();
  const animal: Animal = {
    id: `animal-${Date.now()}-${Math.round(Math.random() * 1000)}`,
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
    slug: uniqueSlug(accountId, input.nom),
    contact_email: input.contact_email,
    contact_telephone: input.contact_telephone,
    created_at: now,
    updated_at: now,
  };
  animaux = [...animaux, animal];
  replaceBadges(animal.id, input.badges);
  replacePhotos(animal.id, input.photoUrls);
  return animal;
}

export function updateAnimal(id: string, input: AnimalFormInput): Animal | undefined {
  const existing = getAnimalById(id);
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

  const updated: Animal = {
    ...existing,
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
    slug:
      input.nom === existing.nom
        ? existing.slug
        : uniqueSlug(existing.account_id, input.nom, id),
    contact_email: input.contact_email,
    contact_telephone: input.contact_telephone,
    updated_at: new Date().toISOString(),
  };
  animaux = animaux.map((a) => (a.id === id ? updated : a));
  replaceBadges(id, input.badges);
  replacePhotos(id, input.photoUrls);
  return updated;
}

/**
 * Action rapide depuis "Mes fiches" : change le statut d'un animal (disponible, réservé,
 * adopté) sans repasser par le formulaire complet, et reste réversible dans les deux sens
 * (ex. annuler un clic "adopté" fait par erreur). La visibilité publique découle uniquement
 * du statut (voir `isAnimalVisiblePublicly`), rien d'autre à mettre à jour ici.
 */
export function changeAnimalStatut(id: string, statut: Animal["statut"]): Animal | undefined {
  const existing = getAnimalById(id);
  if (!existing) return undefined;

  const date_adoption = dateForStatutTarget(existing.date_adoption, "adopte", statut, existing.statut);
  const date_reservation = dateForStatutTarget(
    existing.date_reservation,
    "reserve",
    statut,
    existing.statut
  );

  const updated: Animal = {
    ...existing,
    statut,
    date_adoption,
    date_reservation,
    updated_at: new Date().toISOString(),
  };
  animaux = animaux.map((a) => (a.id === id ? updated : a));
  return updated;
}

export function deleteAnimal(id: string) {
  animaux = animaux.filter((a) => a.id !== id);
  animalBadges = animalBadges.filter((b) => b.animal_id !== id);
  animalPhotos = animalPhotos.filter((p) => p.animal_id !== id);
}

export function listBadgesForAnimalMutable(animalId: string) {
  return animalBadges.filter((b) => b.animal_id === animalId).sort((a, b) => a.ordre - b.ordre);
}

export function listPhotosForAnimalMutable(animalId: string) {
  return animalPhotos.filter((p) => p.animal_id === animalId).sort((a, b) => a.ordre - b.ordre);
}

function replaceBadges(animalId: string, badges: { type: TypeBadge; label: string }[]) {
  animalBadges = animalBadges.filter((b) => b.animal_id !== animalId);
  badges.forEach((badge, index) => {
    animalBadges.push({
      id: `badge-${animalId}-${index}`,
      animal_id: animalId,
      type: badge.type,
      label: badge.label,
      ordre: index + 1,
    });
  });
}

function replacePhotos(animalId: string, urls: string[]) {
  animalPhotos = animalPhotos.filter((p) => p.animal_id !== animalId);
  urls
    .map((u) => u.trim())
    .filter(Boolean)
    .forEach((url, index) => {
      animalPhotos.push({
        id: `photo-${animalId}-${index}`,
        animal_id: animalId,
        url,
        ordre: index + 1,
      });
    });
}
