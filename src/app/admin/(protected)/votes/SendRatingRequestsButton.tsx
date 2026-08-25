"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { AutoDismiss } from "@/components/AutoDismiss";
import { sendRatingRequestsAction, type SavedState } from "../../actions";

const initialState: SavedState = { saved: false };

export function SendRatingRequestsButton() {
  const [state, formAction, pending] = useActionState(sendRatingRequestsAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        Envoyer les demandes d&apos;avis
      </button>
      {state.saved && (
        <AutoDismiss key={state.savedAt}>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Demandes envoyées.
          </span>
        </AutoDismiss>
      )}
    </form>
  );
}
