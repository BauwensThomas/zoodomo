"use client";

import { useEffect, useId, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

/**
 * Widget CAPTCHA Cloudflare Turnstile, sur `/inscription` et le formulaire "mot de passe
 * oublié" (`ForgotPasswordFields.tsx`). Rendu via l'API JS explicite (`turnstile.render`)
 * plutôt que le scan automatique par classe CSS : plus fiable dans une app React où ce
 * composant peut être monté/démonté dynamiquement (bascule sans navigation, voir
 * docs/DECISIONS.md). Doit être placé à l'intérieur du `<form>` : le widget crée lui-même un
 * champ caché `cf-turnstile-response` inclus automatiquement dans les données du formulaire à
 * la soumission, lu côté serveur par `signupAction`/`requestPasswordResetAction`.
 *
 * La clé secrète ne touche jamais ce composant ni le reste du code : c'est Supabase Auth qui
 * vérifie le jeton lui-même (Authentication > Settings > CAPTCHA protection côté dashboard).
 */
export function TurnstileWidget({ action }: { action: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    function renderWidget() {
      if (cancelled || !window.turnstile || !containerRef.current || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        action,
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      // Le script (chargé via `next/script` ci-dessous) peut ne pas encore être prêt au
      // premier rendu de ce composant : réessaie jusqu'à ce que `window.turnstile` existe.
      pollInterval = setInterval(() => {
        if (window.turnstile) {
          if (pollInterval) clearInterval(pollInterval);
          renderWidget();
        }
      }, 100);
    }

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="flex justify-center" ref={containerRef} id={`turnstile-${reactId}`} />
    </>
  );
}
