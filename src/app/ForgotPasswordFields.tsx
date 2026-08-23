"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, MailCheck } from "lucide-react";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { requestPasswordResetAction, type RequestResetState } from "./mot-de-passe-oublie/actions";

const initialState: RequestResetState = { submitted: false };

/**
 * Contenu seul (titre/formulaire/confirmation), sans habillage de page : utilisé à la fois
 * intégré directement sur la page de connexion (`src/app/page.tsx`, bascule sans navigation
 * après un échec de connexion) et sur la page dédiée `/mot-de-passe-oublie` (lien direct,
 * ou redirection depuis `src/app/auth/confirm/route.ts` si le lien reçu par email est
 * expiré/déjà utilisé). Voir docs/DECISIONS.md.
 */
export function ForgotPasswordFields({
  initialEmail,
  linkInvalid,
}: {
  initialEmail: string;
  linkInvalid: boolean;
}) {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);
  const t = useTranslations("admin.forgotPassword");

  if (state.submitted) {
    return (
      <>
        <MailCheck className="mt-8 h-12 w-12 text-foreground" />
        <h1 className="mt-4 font-heading text-2xl font-medium tracking-tight text-foreground">
          {t("submittedTitle")}
        </h1>
        <p className="mt-2 text-sm text-foreground">{t("submittedBody")}</p>
      </>
    );
  }

  return (
    <>
      <h1 className="mt-8 font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-foreground">{t("subtitle")}</p>

      {linkInvalid && (
        <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-red-600">
          <AlertTriangle className="h-4 w-4" />
          {t("linkInvalid")}
        </p>
      )}

      <form action={formAction} className="mt-6 w-full space-y-4 text-left">
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-foreground">
            {t("email")}
          </label>
          <input
            id="reset-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={initialEmail}
            className="mt-1.5 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <TurnstileWidget action="password_reset" />

        <button
          type="submit"
          disabled={pending}
          className="w-full cursor-pointer rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>
    </>
  );
}
