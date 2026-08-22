"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AutoDismiss } from "@/components/AutoDismiss";
import { resendVerificationAction, type ResendState } from "./actions";

const initialState: ResendState = { saved: false };

export function ResendLinkButton({
  email,
  label,
  confirmation,
}: {
  email: string;
  label: string;
  confirmation: string;
}) {
  const [state, formAction] = useActionState(resendVerificationAction.bind(null, email), initialState);

  return (
    <form action={formAction} className="mt-4 flex flex-col items-center gap-2">
      <button
        type="submit"
        className="cursor-pointer text-sm font-medium text-foreground underline transition-opacity hover:opacity-70"
      >
        {label}
      </button>
      {state.saved && (
        <AutoDismiss key={state.savedAt}>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {confirmation}
          </span>
        </AutoDismiss>
      )}
    </form>
  );
}
