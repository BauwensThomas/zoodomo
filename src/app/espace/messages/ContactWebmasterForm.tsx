"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { AutoDismiss } from "@/components/AutoDismiss";
import { LegacyPhotoUploadField } from "@/components/LegacyPhotoUploadField";
import { sendSupportMessageAction, type SavedState } from "../actions";

const initialState: SavedState = { saved: false };

export function ContactWebmasterForm({
  reasonLabel,
  reasonBug,
  reasonCompte,
  reasonSuggestion,
  reasonAutre,
  subjectLabel,
  bodyLabel,
  photoLabel,
  photoDropLabel,
  photoMaxReached,
  photoRemoveAria,
  send,
  sentConfirmation,
}: {
  reasonLabel: string;
  reasonBug: string;
  reasonCompte: string;
  reasonSuggestion: string;
  reasonAutre: string;
  subjectLabel: string;
  bodyLabel: string;
  photoLabel: string;
  photoDropLabel: string;
  photoMaxReached: string;
  photoRemoveAria: string;
  send: string;
  sentConfirmation: string;
}) {
  const [state, formAction] = useActionState(sendSupportMessageAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-foreground bg-card p-5">
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-foreground">
          {reasonLabel}
        </label>
        <select
          id="reason"
          name="reason"
          defaultValue="bug"
          className="mt-1.5 w-full max-w-xs rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
        >
          <option value="bug">{reasonBug}</option>
          <option value="compte">{reasonCompte}</option>
          <option value="suggestion">{reasonSuggestion}</option>
          <option value="autre">{reasonAutre}</option>
        </select>
      </div>
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-foreground">
          {subjectLabel}
        </label>
        <input
          id="subject"
          name="subject"
          required
          className="mt-1.5 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label htmlFor="body" className="block text-sm font-medium text-foreground">
          {bodyLabel}
        </label>
        <textarea
          id="body"
          name="body"
          rows={4}
          required
          className="mt-1.5 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground">{photoLabel}</label>
        {/* `key` sur `savedAt` : réinitialise le champ après un envoi réussi, pour ne pas
            réattacher par erreur la même capture d'écran au message suivant. */}
        <LegacyPhotoUploadField
          key={state.savedAt ?? "empty"}
          name="photo"
          maxPhotos={1}
          dropLabel={photoDropLabel}
          maxReachedLabel={photoMaxReached}
          removeLabel={photoRemoveAria}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Send className="h-4 w-4" />
          {send}
        </button>
        {state.saved && (
          <AutoDismiss key={state.savedAt}>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              {sentConfirmation}
            </span>
          </AutoDismiss>
        )}
      </div>
    </form>
  );
}
