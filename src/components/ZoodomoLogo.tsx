import Image from "next/image";

// Dimensions intrinsèques du fichier source clair (public/brand/zoodomo-wordmark.png),
// utilisées comme référence pour la taille du conteneur (la version sombre a un ratio
// légèrement différent, cf. `object-contain` ci-dessous : jamais déformée, juste centrée).
const INTRINSIC_WIDTH = 480;
const INTRINSIC_HEIGHT = 110;

/**
 * Les deux versions (claire, sombre) sont toujours rendues, l'affichage de l'une ou l'autre
 * est tranché en CSS pur (`.logo-light`/`.logo-dark`, `src/app/globals.css`), avec le même
 * scoping que `ThemeToggle`/les tokens de couleur (`.app-theme-scope` + préférence
 * système/`data-theme`) : pas de logique côté client qui devinerait le thème actif, donc pas
 * de flash ni d'incohérence à l'hydratation. Hors de `.app-theme-scope` (pages pas encore
 * reskinnées, pages publiques toujours claires) : `.logo-dark` reste masquée par défaut,
 * seule la version claire s'affiche.
 */
export function ZoodomoLogo({ width = 140 }: { width?: number }) {
  const height = Math.round((width / INTRINSIC_WIDTH) * INTRINSIC_HEIGHT);

  return (
    <span className="relative inline-block" style={{ width, height }}>
      <Image
        src="/brand/zoodomo-wordmark.png"
        alt="Zoodomo"
        fill
        unoptimized
        loading="eager"
        className="logo-light object-contain"
      />
      <Image
        src="/brand/zoodomo-wordmark-dark.png"
        alt="Zoodomo"
        fill
        unoptimized
        loading="eager"
        className="logo-dark object-contain"
      />
    </span>
  );
}
