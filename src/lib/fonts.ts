/**
 * Paires de police (titres + texte) proposées dans Personnalisation. Chaque police est
 * préchargée une fois pour toutes dans src/app/layout.tsx (next/font/google), avec sa
 * propre variable CSS ; ce fichier fait juste le lien entre l'id stocké sur le compte
 * (`AccountTheme.police`) et les variables à appliquer.
 */
export const POLICE_IDS = ["default", "moderne", "classique", "arrondie"] as const;
export type PoliceId = (typeof POLICE_IDS)[number];

export const POLICE_FONT_VARS: Record<PoliceId, { heading: string; body: string }> = {
  default: { heading: "var(--font-heading-default)", body: "var(--font-body-default)" },
  moderne: { heading: "var(--font-heading-moderne)", body: "var(--font-body-moderne)" },
  classique: { heading: "var(--font-heading-classique)", body: "var(--font-body-classique)" },
  arrondie: { heading: "var(--font-heading-arrondie)", body: "var(--font-body-arrondie)" },
};

export function isPoliceId(value: string): value is PoliceId {
  return (POLICE_IDS as readonly string[]).includes(value);
}
