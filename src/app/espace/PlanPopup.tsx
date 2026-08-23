"use client";

import { X } from "lucide-react";
import { choisirPlanAction } from "./actions";

/**
 * Affiché par-dessus l'espace membre. Deux contextes : (1) essai gratuit terminé
 * (`plan === "essai"` et `isTrialExpired`, déclenché depuis `espace/layout.tsx`) : pas
 * d'`onClose`, le choix d'un plan est obligatoire, aucun bouton pour fermer sans choisir ;
 * (2) ouvert volontairement avant la fin de l'essai (lien "Passer à un abonnement" du
 * tableau de bord, voir `TrialBanner.tsx`) : `onClose` fourni, un bouton fermer apparaît,
 * rien n'oblige encore à choisir à ce stade. `"use client"` uniquement pour ce bouton
 * fermer ; les deux boutons de choix restent chacun leur propre `<form>` lié à
 * `choisirPlanAction` via `.bind`, même principe que les autres actions à paramètre de ce
 * projet (ex. `setMessageReadAction.bind(null, ...)`), qui fonctionne aussi bien dans un
 * composant client que serveur.
 */
export function PlanPopup({
  title,
  body,
  monthlyLabel,
  monthlyPrice,
  annualLabel,
  annualPrice,
  annualHint,
  autoRenewNotice,
  choose,
  onClose,
  closeLabel,
}: {
  title: string;
  body: string;
  monthlyLabel: string;
  monthlyPrice: string;
  annualLabel: string;
  annualPrice: string;
  annualHint: string;
  autoRenewNotice: string;
  choose: string;
  onClose?: () => void;
  closeLabel?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
            className="absolute right-4 top-4 cursor-pointer text-foreground transition-opacity hover:opacity-70"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <h2 className="font-heading text-xl font-medium text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-foreground">{body}</p>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
            <div>
              <p className="font-medium text-foreground">{monthlyLabel}</p>
              <p className="text-sm text-foreground">{monthlyPrice}</p>
            </div>
            <form action={choisirPlanAction.bind(null, "mensuel")}>
              <button
                type="submit"
                className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                {choose}
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
            <div>
              <p className="font-medium text-foreground">
                {annualLabel} <span className="text-xs">({annualHint})</span>
              </p>
              <p className="text-sm text-foreground">{annualPrice}</p>
            </div>
            <form action={choisirPlanAction.bind(null, "annuel")}>
              <button
                type="submit"
                className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                {choose}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-4 text-xs text-foreground">{autoRenewNotice}</p>
      </div>
    </div>
  );
}
