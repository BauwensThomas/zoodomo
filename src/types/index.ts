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

export type DispositionGalerie = "grille" | "empilee" | "alternee";

/** Disposition des cartes d'espèces sur la page d'accueil publique (`/[compte]`). */
export type DispositionEspeces = "liste" | "cote_a_cote" | "vitrine";

/** Disposition de la section "Nous découvrir" (texte de présentation + photos du compte). */
export type DispositionPresentation = "texte_photos" | "photo_texte" | "texte_photo";

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
   * Adresse postale du compte (absent du schéma SQL du brief, écart documenté dans
   * DECISIONS.md). Affichée dans le bloc de contact de la page publique du compte
   * (`/[compte]`) et sur la future fiche animal imprimée (section 8), sous réserve de
   * `adresse_visible`.
   */
  adresse: string | null;
  /**
   * Certains comptes (éleveurs particuliers notamment) ne souhaitent pas communiquer leur
   * adresse, ni publiquement ni sur un document imprimé, pour des raisons de sécurité/vie
   * privée. `true` par défaut : si une adresse est renseignée, elle est affichée sauf
   * désactivation explicite ici (case à décocher dans l'onglet Compte).
   */
  adresse_visible: boolean;
  /**
   * Numéro d'entreprise/TVA (numéro BCE en Belgique), absent du schéma SQL du brief. Un
   * vendeur professionnel doit généralement pouvoir justifier ce numéro sur ses annonces
   * commerciales ; une association/refuge peut aussi en avoir un (ASBL) mais n'y est pas
   * toujours tenu de la même façon. Champ générique optionnel, pas de distinction de type
   * de compte (refuge/vendeur) dans le modèle de données actuel.
   */
  numero_entreprise: string | null;
  /** Même principe que `adresse_visible`, `true` par défaut. */
  numero_entreprise_visible: boolean;
  /**
   * Texte de présentation du compte affiché dans la section "Nous découvrir" de la page
   * publique (`/[compte]`), au même principe multilingue que `Animal.description` : une
   * entrée par langue active du compte. Absent du schéma SQL du brief.
   */
  a_propos: Partial<Record<Locale, string>>;
  /**
   * Langues dans lesquelles le compte rédige son contenu (description, foyer idéal).
   * Choisi dans l'espace membre (onglet Compte) ; non présent dans le schéma SQL du brief
   * section 5, ajouté pour l'exigence i18n de la section 6. Le visiteur choisit parmi ces
   * langues sur les pages publiques (petit sélecteur à côté du lien de retour).
   */
  langues_actives: Locale[];
  /**
   * Langue d'interface préférée du pro connecté à ce compte (menus, boutons, etc.), à ne
   * pas confondre avec `langues_actives` (langues dans lesquelles il rédige son contenu).
   * `null` seulement pour un compte qui ne s'est encore jamais connecté : dès l'inscription,
   * initialisée à la langue résolue au moment de l'inscription (celle du sélecteur de langue
   * déjà présent sur cette page, ou détectée depuis le navigateur si le visiteur ne l'a pas
   * changée), voir `signupAction`/`loginAction` (`src/app/signup-actions.ts`/`login-actions.ts`).
   * À la première connexion d'un compte plus ancien qui n'a jamais eu l'occasion de la
   * définir, initialisée de la même façon. Une fois posée (inscription, connexion, ou
   * sélecteur dans le tableau de bord), elle reste prioritaire sur le cookie/navigateur pour
   * toutes les visites suivantes, y compris depuis un autre appareil, voir
   * `src/i18n/request.ts`, `DECISIONS.md`.
   */
  langue_interface: Locale | null;
  /**
   * Préférence de mode sombre du pro connecté, même principe que `langue_interface` : suit
   * le compte d'un appareil à l'autre plutôt que de dépendre du cookie `THEME_PREFERENCE` de
   * l'appareil courant (utilisé, lui, pour les pages hors espace membre). `null` = suit la
   * préférence système (comportement par défaut, jamais réglé explicitement), voir
   * `src/app/espace/layout.tsx`, `docs/DECISIONS.md`.
   */
  theme_preference: "light" | "dark" | null;
  /**
   * `"essai"` pendant les 15 jours gratuits suivant l'inscription (`TRIAL_DAYS`,
   * `src/lib/mock/helpers.ts`, calculé à partir de `created_at`, jamais stocké tel quel pour
   * éviter un décompte qui dérive). Passe à `"mensuel"` ou `"annuel"` une fois un plan choisi
   * dans le popup affiché après expiration de l'essai (`src/app/espace/PlanPopup.tsx`). Pas de
   * vrai paiement Paddle branché pour l'instant (V1.1, voir `docs/BRIEF-COMPLET-SAAS-ANIMAUX.md`
   * section 8) : ce champ suit uniquement le choix du compte, prêt à être relié à un vrai
   * abonnement plus tard sans changer sa forme.
   */
  plan: "essai" | "mensuel" | "annuel";
  created_at: string;
}

export interface AccountTheme {
  account_id: string;
  police: string;
  couleur_primaire: string;
  couleur_secondaire: string;
  disposition_photos: DispositionGalerie;
  /** Absent du schéma SQL du brief, ajouté pour personnaliser la page d'accueil publique. */
  disposition_especes: DispositionEspeces;
  /** Absent du schéma SQL du brief, ajouté pour personnaliser la section "Nous découvrir". */
  disposition_presentation: DispositionPresentation;
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

export type AccountMessageKind =
  | "bienvenue"
  | "rappel_fiche"
  | "essai_gratuit"
  | "essai_rappel_4j"
  | "essai_rappel_1j"
  | "admin";

/** Trois états mutuellement exclusifs plutôt que des booléens indépendants (`archived`
 * + un futur `deleted`) : évite les combinaisons ambiguës (un message archivé ET supprimé
 * n'a pas de sens), une seule vue possible à la fois. */
export type MessageStatus = "active" | "archived" | "trash";

/** Message reçu par un compte dans l'onglet "Messages" de l'espace membre : message de
 * bienvenue automatique, rappel de fiche non mise à jour, ou message envoyé par l'admin
 * Zoodomo. Pas de vrai email, uniquement affiché dans l'app (voir docs/DECISIONS.md).
 * `subject`/`body` dans une seule langue (celle du destinataire, `Account.langue_interface`,
 * français par défaut) : chaque `AccountMessage` appartient déjà à un seul `account_id`, donc
 * pas d'ambiguïté à résoudre côté affichage, contrairement à `animaux.description` qui est
 * partagée par tous les visiteurs. Un envoi "Tous les comptes" écrit un message distinct par
 * compte, chacun dans sa propre langue, voir docs/DECISIONS.md. */
export interface AccountMessage {
  id: string;
  account_id: string;
  kind: AccountMessageKind;
  subject: string;
  body: string;
  created_at: string;
  read: boolean;
  status: MessageStatus;
  animal_id: string | null;
}

export type SupportReason = "bug" | "compte" | "suggestion" | "autre";

/** Message envoyé par un compte vers l'admin Zoodomo ("contacter le webmaster"), avec une
 * raison présélectionnée (questionnaire) plutôt qu'un objet libre, et un objet écrit
 * librement (repris avec un préfixe "RE : " si l'admin répond depuis `/admin`). Pas
 * multilingue : rédigé et lu dans une seule langue (celle du pro qui écrit, celle de
 * l'admin qui lit), pas besoin de résolution par langue comme pour `AccountMessage`. */
export interface SupportMessage {
  id: string;
  account_id: string;
  reason: SupportReason;
  subject: string;
  body: string;
  /** Capture d'écran optionnelle jointe par le pro (ex. pour illustrer un bug). Une seule
   * photo, compressée côté client puis stockée en `data:` URL comme le reste des photos en
   * phase mockée (voir `PhotoUploadField`, `docs/DECISIONS.md`), pas de bucket Supabase
   * Storage pour l'instant. */
  photo_url: string | null;
  created_at: string;
  read: boolean;
  status: MessageStatus;
}
