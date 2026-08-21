"use client";

import Link from "next/link";

/**
 * Simple lien Next.js avec `scroll={false}` : combiné à une barre d'onglets `sticky`
 * (toujours visible pendant le défilement, voir les pages qui utilisent ce composant),
 * le bouton n'est jamais hors écran, donc jamais besoin de remonter la page pour l'atteindre
 * ni de compenser un défilement. Une tentative précédente de restauration manuelle de la
 * position de défilement (`router.push` + `useEffect`) s'est avérée inutile une fois la
 * vraie cause identifiée : la barre d'onglets sortait simplement de l'écran au-delà d'un
 * certain défilement, ce n'était pas un problème côté JS, voir docs/DECISIONS.md.
 */
export function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active ? "border-foreground text-foreground" : "border-transparent text-foreground hover:opacity-70"
      }`}
    >
      {children}
    </Link>
  );
}
