/**
 * Types alignés sur le schéma SQL de référence (docs/BRIEF-COMPLET-SAAS-ANIMAUX.md, section 5).
 * Noms de champs conservés en français/snake_case pour un passage direct à Supabase plus tard.
 */

export type Sexe = "male" | "femelle";

/**
 * Langues d'interface et de contenu (brief section 6 : fr/nl/en dès le MVP).
 * `Locale` sert à la fois pour l'interface Zoodomo et pour le contenu saisi par le compte.
 */
export type Locale = "fr" | "nl" | "en";

export const LOCALES: Locale[] = ["fr", "nl", "en"];

export type StatutAnimal = "disponible" | "reserve" | "adopte";

export type DispositionGalerie = "grille" | "empilee" | "alternee" | "carrousel";

export type TypeBadge =
  | "senior"
  | "sos"
  | "coeur_patient"
  | "adoptant_expert"
  | "autre";

export interface Account {
  id: string;
  email: string;
  nom_affichage: string;
  slug: string; // identifiant public du compte dans l'URL
  contact_email_public: string | null;
  contact_telephone_public: string | null;
  /**
   * Langues dans lesquelles le compte rédige son contenu (description, foyer idéal).
   * Choisi dans l'espace membre (onglet Compte) ; non présent dans le schéma SQL du brief
   * section 5, ajouté pour l'exigence i18n de la section 6. Le visiteur choisit parmi ces
   * langues sur les pages publiques (petit sélecteur à côté du lien de retour).
   */
  langues_actives: Locale[];
  created_at: string;
}

export interface AccountTheme {
  account_id: string;
  police: string;
  couleur_primaire: string;
  couleur_secondaire: string;
  disposition_photos: DispositionGalerie;
  logo_url: string | null;
  lien_retour_site: string | null;
  updated_at: string;
}

export interface Espece {
  id: string;
  nom: string; // ex: 'Chien', 'Chat', 'Lapin'
  slug: string;
  ordre: number;
}

export interface Animal {
  id: string;
  account_id: string;
  nom: string;
  espece_id: string;
  /**
   * Race/sous-espèce en texte libre, écrite directement par le compte, plutôt qu'une
   * liste fermée gérée via une table `sous_especes` dédiée comme le prévoyait le brief
   * section 5. `especes` reste une vraie table de référence (nécessaire au filtrage par
   * espèce sur les pages publiques, `/[compte]/[espece]`), mais la race elle-même n'a pas
   * besoin d'un référentiel fermé : impossible à maintenir exhaustivement (des centaines
   * de races par espèce, plus les espèces de ferme/exotiques) et ça empêchait un
   * professionnel de saisir la race exacte de son animal si elle n'était pas dans la
   * liste. Écart assumé, documenté dans le brief et `docs/DECISIONS.md`.
   */
  race: string | null;
  sexe: Sexe | null;
  sterilise: boolean | null;
  /**
   * Le brief section 5 prévoyait volontairement "juste l'année, pas de date de naissance
   * précise" (`annee_naissance integer`). Écart assumé sur demande utilisateur : `annee_naissance`
   * reste le champ de repli quand seule l'année est connue, mais `date_naissance` permet de
   * saisir jour + mois quand ils sont connus (plus précis, affiché à la place de l'année sur
   * la fiche publique si renseigné). Les deux sont optionnels et indépendants.
   */
  annee_naissance: number | null;
  date_naissance: string | null;
  numero_identification: string | null;
  date_arrivee: string | null;
  origine: string | null;
  /**
   * Contenu multilingue : une entrée par langue activée sur le compte (`langues_actives`).
   * Si le compte a coché plusieurs langues, il doit remplir chacune ; sinon une seule clé.
   */
  description: Partial<Record<Locale, string>>;
  foyer_ideal: Partial<Record<Locale, string>>; // liste à puces, une entrée par ligne, par langue
  prix: number | null;
  /**
   * Statut = seule chose qui pilote la visibilité publique de la fiche (pas de champ
   * "publiée/brouillon" séparé, écart assumé par rapport au brief section 3/9 : une fiche
   * créée est visible immédiatement). "disponible" et "réservé" restent toujours visibles ;
   * "adopté" reste visible avec la mention "Adopté" pendant 7 jours après `date_adoption`
   * (voir `isAnimalVisiblePublicly` dans `src/lib/mock/helpers.ts`), puis disparaît des
   * pages publiques sans action manuelle.
   */
  statut: StatutAnimal;
  /**
   * Date à laquelle l'animal est passé au statut "adopté" (adopté ou vendu selon le
   * contexte du compte), calculée automatiquement à chaque changement de statut, pas
   * saisie à la main. Absente du schéma SQL du brief section 5, ajoutée ici pour
   * répondre au besoin de savoir depuis quand un animal n'est plus disponible.
   * `null` tant que l'animal n'a jamais été marqué adopté, ou s'il est repassé à un
   * autre statut depuis.
   */
  date_adoption: string | null;
  /**
   * Date à laquelle l'animal est passé au statut "réservé", calculée automatiquement à
   * chaque changement de statut, pas saisie à la main (même principe que `date_adoption`).
   * Absente du schéma SQL du brief section 5. `null` tant que l'animal n'a jamais été
   * marqué réservé, ou s'il est reparti sur un autre statut depuis.
   */
  date_reservation: string | null;
  slug: string; // pour l'URL publique
  /**
   * Contact spécifique à l'animal (non présent dans le schéma SQL du brief section 5,
   * mais requis par la section 3 : "utilise en priorité le contact spécifique de l'animal
   * s'il existe, sinon retombe automatiquement sur le contact générique du compte").
   * Ajouté ici, à reporter dans le brief/schéma SQL avant le passage à Supabase.
   */
  contact_email: string | null;
  contact_telephone: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnimalBadge {
  id: string;
  animal_id: string;
  type: TypeBadge;
  label: string; // texte affiché, ex: "Cœur patient depuis 2022"
  ordre: number;
}

export interface AccountPhoto {
  id: string;
  account_id: string;
  url: string;
  ordre: number;
  created_at: string;
}

export interface AnimalPhoto {
  id: string;
  animal_id: string;
  url: string;
  ordre: number;
}

export interface AnimalView {
  id: string;
  animal_id: string;
  viewed_at: string;
}
