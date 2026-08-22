"use client";

import { useEffect, useRef } from "react";

/**
 * Déclenche l'enregistrement d'une vue une seule fois par vrai affichage de la fiche, côté
 * navigateur (`useRef` en garde-fou : React 18/19 exécute deux fois les effets sans nettoyage
 * en développement, Strict Mode, ce qui doublerait le compte sans cette garde ; sans effet en
 * production où ce double-appel n'existe pas). Voir `src/app/api/animal-views/route.ts` et
 * docs/DECISIONS.md pour la raison de ce détour (effet de bord retiré du rendu de la page).
 */
export function RecordAnimalView({ animalId }: { animalId: string }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    fetch("/api/animal-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animalId }),
      keepalive: true,
    }).catch(() => {
      // Échec silencieux : un compteur de vues raté n'est pas une erreur à remonter au
      // visiteur, voir la même tolérance déjà en place pour `recordAnimalView`.
    });
  }, [animalId]);

  return null;
}
