"use client";

import { useState } from "react";
import { PlanPopup } from "./PlanPopup";

/**
 * Bannière de compte à rebours du Dashboard, avec un lien pour passer à un abonnement dès
 * maintenant (sans attendre la fin de l'essai) : ouvre le même `PlanPopup` que celui affiché
 * obligatoirement après expiration, mais fermable ici (`onClose`), puisque rien n'oblige
 * encore à choisir à ce stade, voir docs/DECISIONS.md.
 */
export function TrialBanner({
  daysText,
  upgradeLink,
  popup,
}: {
  daysText: string;
  upgradeLink: string;
  popup: {
    title: string;
    body: string;
    monthlyLabel: string;
    monthlyPrice: string;
    annualLabel: string;
    annualPrice: string;
    annualHint: string;
    autoRenewNotice: string;
    choose: string;
    close: string;
  };
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-orange-200 bg-orange-100 p-3.5 text-sm text-orange-900">
      <span>{daysText}</span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer font-semibold underline underline-offset-2 hover:opacity-80"
      >
        {upgradeLink}
      </button>

      {open && (
        <PlanPopup
          title={popup.title}
          body={popup.body}
          monthlyLabel={popup.monthlyLabel}
          monthlyPrice={popup.monthlyPrice}
          annualLabel={popup.annualLabel}
          annualPrice={popup.annualPrice}
          annualHint={popup.annualHint}
          autoRenewNotice={popup.autoRenewNotice}
          choose={popup.choose}
          onClose={() => setOpen(false)}
          closeLabel={popup.close}
        />
      )}
    </div>
  );
}
