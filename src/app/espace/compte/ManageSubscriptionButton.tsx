"use client";

import { useState } from "react";
import { createManageSubscriptionSessionAction } from "../actions";

/** Ouvre le portail client Paddle (factures, moyen de paiement, résiliation) pour
 * l'abonnement du compte connecté. N'affiché que si le compte a déjà un abonnement Paddle
 * réel (`account.paddle_subscription_id`), voir `ComptePageForm.tsx`/`page.tsx`. */
export function ManageSubscriptionButton({ label, error }: { label: string; error: string }) {
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setHasError(false);
    const result = await createManageSubscriptionSessionAction();
    if ("url" in result) {
      window.location.href = result.url;
      return;
    }
    setHasError(true);
    setLoading(false);
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className="cursor-pointer rounded-full border border-foreground px-4 py-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>
      {hasError && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
