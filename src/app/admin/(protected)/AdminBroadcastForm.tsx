"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";
import { sendAdminBroadcastAction, type SavedState } from "../actions";
import { OpenPhotoLink } from "./OpenPhotoLink";
import { LOCALES, type Locale } from "@/types";

const initialState: SavedState = { saved: false };

const LANGUAGE_LABEL: Record<Locale, string> = {
  fr: "Français",
  nl: "Nederlands",
  en: "English",
};

/**
 * Les champs de langue affichés dépendent du destinataire choisi (retour utilisateur) : on
 * connaît désormais la langue d'interface réelle de chaque compte (`langue_interface`,
 * français par défaut tant qu'il n'a pas choisi), donc pas la peine de demander un texte en
 * néerlandais si aucun compte ciblé ne travaille dans cette langue. "Tous les comptes"
 * affiche l'union des langues effectives de tous les comptes (souvent 1 ou 2 langues, pas
 * forcément les 3) ; un compte précis (ou "Répondre" à un message, qui présélectionne un
 * compte précis) n'affiche qu'un seul champ, sa propre langue. Chaque compte ciblé reçoit
 * ensuite son message dans sa seule langue (`sendAdminBroadcastAction`), pas dans toutes les
 * langues à la fois, voir docs/DECISIONS.md.
 */
function effectiveLocale(account: { langue_interface: Locale | null }): Locale {
  return account.langue_interface ?? "fr";
}

export function AdminBroadcastForm({
  accounts,
  initialTarget,
  initialSubject,
  initialReplyMessageId,
  originalMessage,
}: {
  accounts: { id: string; nom: string; langue_interface: Locale | null }[];
  initialTarget?: string;
  initialSubject?: string;
  initialReplyMessageId?: string;
  /** Message "contacter le webmaster" d'origine, rappelé au-dessus du formulaire lors d'un
   * "Répondre" : sans ça, rien ne rappelle ce que le pro a écrit pendant la rédaction de la
   * réponse (pas de fil de discussion en phase mockée), voir docs/DECISIONS.md. */
  originalMessage?: {
    fromName: string;
    subject: string;
    body: string;
    photoUrl: string | null;
  };
}) {
  const [state, formAction] = useActionState(sendAdminBroadcastAction, initialState);
  const [target, setTarget] = useState(initialTarget ?? "tous");
  const router = useRouter();

  // Un envoi réussi ne doit pas laisser le formulaire tel quel : destinataire, objet/message
  // et le rappel du message d'origine (si "Répondre" avait été utilisé) doivent repartir à
  // zéro. Comme `initialTarget`/`initialSubject`/`initialReplyMessageId`/`originalMessage`
  // viennent tous des paramètres d'URL (`reply`/`subject`/`replyMessageId`, lus par la page
  // parente), les réinitialiser un par un ici ne suffirait pas à couvrir "Répondre" (le
  // destinataire redeviendrait `initialTarget`, pas "tous"). Nettoyer l'URL vers `/admin`
  // change ces paramètres à `undefined`, ce qui change aussi le `key` posé par la page
  // parente sur ce composant : tout le composant (y compris `useActionState`, donc la
  // confirmation "Message envoyé !") est alors remonté avec des props vides, reset complet
  // garanti en un seul geste plutôt que de dupliquer la logique de repli pour chaque champ.
  // Léger délai avant de nettoyer l'URL : sinon la confirmation disparaîtrait instantanément
  // avec le reste du formulaire, sans jamais avoir eu le temps d'être vue, voir
  // docs/DECISIONS.md.
  useEffect(() => {
    if (!state.savedAt) return;
    const timer = setTimeout(() => router.replace("/admin", { scroll: false }), 1500);
    return () => clearTimeout(timer);
  }, [state.savedAt, router]);

  const visibleLanguages = useMemo(() => {
    if (target === "tous") {
      const set = new Set<Locale>();
      for (const a of accounts) set.add(effectiveLocale(a));
      const langues = LOCALES.filter((l) => set.has(l));
      return langues.length > 0 ? langues : (["fr"] as Locale[]);
    }
    const account = accounts.find((a) => a.id === target);
    return [account ? effectiveLocale(account) : "fr"] as Locale[];
  }, [target, accounts]);

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground";

  return (
    <section className="rounded-2xl border border-foreground bg-card p-5">
      <h2 className="font-heading text-lg font-medium text-foreground">Envoyer un message</h2>

      {originalMessage && (
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-xs font-medium text-foreground">
            Message reçu de {originalMessage.fromName} :
          </p>
          <p className="mt-1.5 text-sm font-medium text-foreground">{originalMessage.subject}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-foreground">{originalMessage.body}</p>
          {originalMessage.photoUrl && (
            <div className="mt-2">
              <OpenPhotoLink
                photoUrl={originalMessage.photoUrl}
                alt="Capture d'écran jointe par le pro"
                className="h-20 w-20 object-cover transition-opacity hover:opacity-80"
              />
            </div>
          )}
        </div>
      )}

      <form action={formAction} className="mt-4 space-y-5">
        {/* Si ce formulaire vient d'un clic sur "Répondre", ce message d'origine ("contacter
            le webmaster") est archivé automatiquement une fois la réponse envoyée avec
            succès, voir docs/DECISIONS.md. */}
        {initialReplyMessageId && (
          <input type="hidden" name="replyMessageId" value={initialReplyMessageId} />
        )}
        <div>
          <label htmlFor="target" className="block text-sm font-medium text-foreground">
            Destinataire
          </label>
          <select
            id="target"
            name="target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className={`${inputClass} max-w-xs`}
          >
            <option value="tous">Tous les comptes</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-foreground">
          {target === "tous"
            ? "Un champ par langue réellement choisie par au moins un compte ciblé (français par défaut tant qu'un compte n'a pas choisi) : chaque compte recevra le message dans sa seule langue, pas dans toutes à la fois."
            : "Langue choisie par ce compte (français par défaut tant qu'il n'a pas choisi lui-même)."}
        </p>

        {visibleLanguages.map((code) => (
          <div key={code} className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-medium text-foreground">{LANGUAGE_LABEL[code]}</p>
            <div>
              <label htmlFor={`subject_${code}`} className="block text-xs font-medium text-foreground">
                Objet
              </label>
              <input
                id={`subject_${code}`}
                name={`subject_${code}`}
                required
                defaultValue={initialSubject}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={`body_${code}`} className="block text-xs font-medium text-foreground">
                Message
              </label>
              <textarea id={`body_${code}`} name={`body_${code}`} rows={3} required className={inputClass} />
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            <Send className="h-4 w-4" />
            Envoyer
          </button>
          {state.saved && (
            <span key={state.savedAt} className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Message envoyé !
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
