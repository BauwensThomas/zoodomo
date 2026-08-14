"use client";

import { useEffect, useState } from "react";

/**
 * Masque son contenu après un délai (5s par défaut) : utilisé pour les bannières de
 * confirmation "Modifications enregistrées !" qui ne doivent pas rester affichées
 * indéfiniment tant que le paramètre `?saved=...` reste dans l'URL.
 */
export function AutoDismiss({
  after = 5000,
  children,
}: {
  after?: number;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), after);
    return () => clearTimeout(timer);
  }, [after]);

  if (!visible) return null;
  return <>{children}</>;
}
