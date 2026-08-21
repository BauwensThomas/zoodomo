"use client";

import { Printer } from "lucide-react";

/**
 * Déclenche l'impression navigateur (`window.print()`) plutôt qu'un PDF généré côté client
 * (contrairement à l'export mensuel de "Mes fiches", `MonthlyPdfExport.tsx`) : la boîte de
 * dialogue d'impression du navigateur propose déjà "Enregistrer en PDF" comme destination,
 * et évite de charger jsPDF sur une page publique. La mise en forme papier vient des styles
 * `print:` (Tailwind) posés sur la page et ses composants, pas de ce bouton lui-même.
 */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground transition-colors hover:text-(--account-primary)"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
