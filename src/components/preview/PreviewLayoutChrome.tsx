"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, PawPrint } from "lucide-react";

/**
 * Reproduit l'en-tête et le pied de page réels de `src/app/[compte]/layout.tsx`, communs
 * aux 3 pages publiques (accueil, catégorie, fiche) : factorisé ici plutôt que dupliqué
 * dans chacun des 3 composants d'aperçu, comme la vraie mise en page qui les enveloppe.
 */
export function PreviewLayoutChrome({
  nomAffichage,
  children,
}: {
  nomAffichage: string;
  children: React.ReactNode;
}) {
  const tCommon = useTranslations("common");
  const launchYear = 2026;
  const currentYear = new Date().getFullYear();
  const yearLabel = currentYear > launchYear ? `${launchYear} - ${currentYear}` : `${launchYear}`;

  return (
    <div className="flex min-h-full flex-col bg-background font-body">
      <header className="border-b border-border bg-(--account-secondary)/90">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white bg-(--account-primary) text-white shadow-sm @min-[640px]:h-11 @min-[640px]:w-11">
              <PawPrint className="h-5 w-5" />
            </span>
            <span className="truncate font-heading text-base font-medium tracking-tight text-foreground @min-[640px]:text-xl">
              {nomAffichage}
            </span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-(--account-primary) bg-white px-3 py-2 text-sm font-semibold text-(--account-primary) shadow-sm">
            <span className="hidden @min-[640px]:inline">{tCommon("backToSite")}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-(--account-secondary) px-6 py-8 text-center">
        <p className="text-sm text-foreground">{tCommon("createdWith", { year: yearLabel })}</p>
      </footer>
    </div>
  );
}
