"use client";

import { useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { acknowledgeCookieConsentAction } from "@/app/actions";

/**
 * Posé dans le layout racine, en dehors de tout `.app-theme-scope` de page : reçoit donc sa
 * propre préférence de thème (cookie `THEME_PREFERENCE`, même source que les pages hors
 * espace membre) et porte son propre `.app-theme-scope`/`data-theme`, pour rester clair ou
 * sombre en cohérence avec le reste du site plutôt qu'une couleur fixe. Un seul bouton "J'ai
 * compris" pour l'instant (pas de vrai choix accepter/refuser par catégorie) : tous les
 * cookies actuels sont strictement nécessaires, refuser n'aurait donc aucun effet réel ; à
 * revoir dès qu'un cookie non essentiel est ajouté (analytics, etc.).
 */
export function CookieConsentBanner({
  initiallyAcknowledged,
  theme,
  message,
  privacyLinkLabel,
  button,
}: {
  initiallyAcknowledged: boolean;
  theme: "light" | "dark" | undefined;
  message: string;
  privacyLinkLabel: string;
  button: string;
}) {
  const [dismissed, setDismissed] = useState(initiallyAcknowledged);

  if (dismissed) return null;

  return (
    <div
      className="app-theme-scope fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card px-4 py-3.5 text-foreground shadow-2xl"
      data-theme={theme}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="flex items-start gap-2 text-sm">
          <Cookie className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {message}{" "}
            <Link href="/politique-confidentialite" className="underline hover:opacity-80">
              {privacyLinkLabel}
            </Link>
          </span>
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            void acknowledgeCookieConsentAction();
          }}
          className="shrink-0 cursor-pointer rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          {button}
        </button>
      </div>
    </div>
  );
}
