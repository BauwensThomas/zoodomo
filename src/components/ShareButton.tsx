"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/**
 * Utilise le sélecteur de partage natif du système (API Web Share) : propose TOUTES les
 * applications installées capables de recevoir un lien (WhatsApp, Messenger, SMS, email,
 * réseaux sociaux...), pas une liste figée choisie à l'avance. Repli sur la copie du lien
 * dans le presse-papiers uniquement si l'API n'est pas disponible (certains navigateurs
 * desktop).
 */
export function ShareButton({ label, copiedLabel, title }: { label: string; copiedLabel: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Annulation par l'utilisateur : ignorée.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="print:hidden inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground transition-colors hover:text-(--account-primary)"
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? copiedLabel : label}
    </button>
  );
}
