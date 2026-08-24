"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { X } from "lucide-react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { createUpdatePaymentMethodSessionAction } from "./actions";

/**
 * Affiché par-dessus l'espace membre. Deux contextes : (1) obligatoire, sans `onClose`
 * (`needsPlanChoice`, déclenché depuis `espace/layout.tsx`), avec 3 raisons possibles
 * (`paymentFailed` prop) : essai terminé ou abonnement résilié/en pause (choix de plan, un
 * nouveau checkout) vs paiement échoué (redirection vers le portail client Paddle pour
 * mettre à jour le moyen de paiement de l'abonnement *existant*, jamais un nouveau checkout
 * qui créerait un second abonnement en double) ; (2) ouvert volontairement avant la fin de
 * l'essai (lien "Passer à un abonnement" du tableau de bord, voir `TrialBanner.tsx`), toujours
 * en mode choix de plan puisqu'un essai en cours n'a par définition aucun abonnement à réparer.
 *
 * Le choix de plan ouvre un vrai checkout Paddle (overlay, voir la compétence d'agent
 * `paddle-checkout-web`) : aucune mise à jour de `accounts.plan` n'est faite ici, ni côté
 * client ni via une action serveur, c'est le webhook (`src/app/api/paddle-webhook/route.ts`)
 * qui reste la seule source de vérité une fois le paiement réellement confirmé par Paddle.
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
  email,
  onClose,
  closeLabel,
  paymentFailed,
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
  email: string;
  onClose?: () => void;
  closeLabel?: string;
  /** Présent uniquement quand `planPopupReason(account) === "payment_failed"` : bascule tout
   * le popup en mode "mettre à jour le moyen de paiement" plutôt que choix de plan. */
  paymentFailed?: { updatePaymentMethod: string; error: string };
}) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [portalError, setPortalError] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const locale = useLocale();
  const paddleRef = useRef<Paddle | null>(null);
  const openPriceId = useRef<string | null>(null);

  useEffect(() => {
    // Le mode "paiement échoué" redirige vers le portail client Paddle (voir
    // `handleUpdatePaymentMethod` plus bas) : pas de checkout à ouvrir ici, inutile
    // d'initialiser Paddle.js pour ce mode.
    if (paymentFailed) return;
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return;
    initializePaddle({
      token,
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox",
      eventCallback(event) {
        // `checkout.completed` ferme l'overlay côté Paddle ; le webhook met à jour le compte
        // en arrière-plan (généralement en quelques secondes). Un rechargement laisse le
        // temps au serveur de refléter le nouvel état au prochain rendu.
        if (event.name === "checkout.completed") {
          setTimeout(() => window.location.reload(), 1500);
        }
        // L'abonnement Zoodomo n'a pas de notion de quantité (un compte = un abonnement),
        // mais Paddle Checkout affiche quand même un sélecteur +/- sans option pour le
        // masquer (limite connue du SDK, aucun paramètre `allowQuantity` côté overlay).
        // `updateItems` recalcule bien le total facturé mais laisse le chiffre affiché du
        // sélecteur désynchronisé (testé, reste visuellement à 2 alors que le prix affiché
        // redevient celui de 1) : ferme puis rouvre entièrement le checkout à la place, pour
        // repartir sur un affichage propre plutôt qu'un état visuellement trompeur.
        const quantity = event.data?.items?.[0]?.quantity;
        if (event.name === "checkout.items.updated" && quantity && quantity !== 1 && openPriceId.current) {
          const priceId = openPriceId.current;
          paddleRef.current?.Checkout.close();
          setTimeout(() => {
            paddleRef.current?.Checkout.open({
              items: [{ priceId, quantity: 1 }],
              customer: { email },
              settings: { variant: "one-page", locale },
            });
          }, 50);
        }
      },
    }).then((p) => {
      if (!p) return;
      paddleRef.current = p;
      setPaddle(p);
    });
    // `email`/`locale`/`paymentFailed` volontairement absents des dépendances : stables pour
    // toute la durée de vie de ce composant (un nouveau `PlanPopup` est monté à chaque
    // ouverture), et `initializePaddle` refuse un second appel (avertissement du SDK) si on
    // le redéclenchait.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCheckout(priceId: string | undefined) {
    if (!paddle || !priceId) return;
    openPriceId.current = priceId;
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email },
      // Suit la langue d'interface Zoodomo (fr/nl/en, `useLocale()`) plutôt que la langue du
      // navigateur détectée par défaut par Paddle : les deux peuvent diverger (ex. compte en
      // NL sur un navigateur en FR), et les 3 langues sont supportées par Paddle Checkout.
      settings: { variant: "one-page", locale },
    });
  }

  async function handleUpdatePaymentMethod() {
    setPortalLoading(true);
    setPortalError(false);
    const result = await createUpdatePaymentMethodSessionAction();
    if ("url" in result) {
      window.location.href = result.url;
      return;
    }
    setPortalError(true);
    setPortalLoading(false);
  }

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

        {paymentFailed ? (
          <div className="mt-6">
            <button
              type="button"
              disabled={portalLoading}
              onClick={handleUpdatePaymentMethod}
              className="w-full cursor-pointer rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paymentFailed.updatePaymentMethod}
            </button>
            {portalError && <p className="mt-3 text-sm text-red-600">{paymentFailed.error}</p>}
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">{monthlyLabel}</p>
                  <p className="text-sm text-foreground">{monthlyPrice}</p>
                </div>
                <button
                  type="button"
                  disabled={!paddle}
                  onClick={() => openCheckout(process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_MONTHLY)}
                  className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {choose}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">
                    {annualLabel} <span className="text-xs">({annualHint})</span>
                  </p>
                  <p className="text-sm text-foreground">{annualPrice}</p>
                </div>
                <button
                  type="button"
                  disabled={!paddle}
                  onClick={() => openCheckout(process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_ANNUAL)}
                  className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {choose}
                </button>
              </div>
            </div>

            <p className="mt-4 text-xs text-foreground">{autoRenewNotice}</p>
          </>
        )}
      </div>
    </div>
  );
}
