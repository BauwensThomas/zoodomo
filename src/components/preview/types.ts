import type {
  Animal,
  AnimalBadge,
  AnimalPhoto,
  DispositionEspeces,
  DispositionGalerie,
  DispositionPresentation,
  Locale,
} from "@/types";

/**
 * Contenu réel du compte (espèces, animaux, photos...) figé au chargement de la page
 * Personnalisation, servant de données pour les 3 aperçus miniatures. Contrairement aux
 * réglages visuels (police, couleurs, dispositions), ce contenu n'est pas éditable ici et
 * ne varie donc pas en direct : seul le rendu visuel change selon les réglages en cours.
 */
export interface PreviewContent {
  account: {
    nomAffichage: string;
    aPropos: Partial<Record<Locale, string>>;
    languesActives: Locale[];
    contactEmailPublic: string | null;
    contactTelephonePublic: string | null;
    adresse: string | null;
    adresseVisible: boolean;
    numeroEntreprise: string | null;
    numeroEntrepriseVisible: boolean;
  };
  accountPhotos: { id: string; url: string }[];
  especes: { id: string; slug: string; nom: string; animalCount: number }[];
  sampleEspece: { slug: string; nom: string } | null;
  sampleAnimaux: Animal[];
  photosByAnimal: Record<string, AnimalPhoto[]>;
  badgesByAnimal: Record<string, AnimalBadge[]>;
  sampleContact: { email: string | null; telephone: string | null } | null;
}

/** Réglages visuels en cours d'édition (pas forcément enregistrés), reflétés en direct dans les 3 aperçus. */
export interface PreviewSettings {
  police: string;
  primary: string;
  secondary: string;
  dispositionEspeces: DispositionEspeces;
  dispositionPresentation: DispositionPresentation;
  dispositionGalerie: DispositionGalerie;
}

export type PreviewPage = "accueil" | "categorie" | "fiche";
export type PreviewDevice = "desktop" | "tablette" | "telephone";
