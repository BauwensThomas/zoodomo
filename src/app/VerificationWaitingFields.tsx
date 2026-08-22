"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, MailCheck } from "lucide-react";
import { ResendLinkButton } from "./verification-email/ResendLinkButton";

/**
 * Contenu seul (icône/titre/texte/bouton "Renvoyer"), sans habillage de page : même principe
 * que `ForgotPasswordFields.tsx`. Utilisé directement sur `/inscription` (bascule sans
 * navigation juste après l'inscription) et sur la page dédiée `/verification-email` (lien de
 * secours nécessaire pour la redirection depuis `src/app/espace/layout.tsx`, cas défensif
 * d'une session existante mais non confirmée). Voir docs/DECISIONS.md.
 */
export function VerificationWaitingFields({
  email,
  linkInvalid,
}: {
  email: string;
  linkInvalid: boolean;
}) {
  const t = useTranslations("admin.verifyEmail");

  return (
    <>
      <MailCheck className="mt-8 h-12 w-12 text-foreground" />
      <h1 className="mt-4 font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-foreground">{t("body", { email })}</p>

      {linkInvalid && (
        <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-red-600">
          <AlertTriangle className="h-4 w-4" />
          {t("linkInvalid")}
        </p>
      )}

      <p className="mt-6 text-xs text-foreground">{t("demoNotice")}</p>

      <ResendLinkButton email={email} label={t("resend")} confirmation={t("resendConfirmation")} />
    </>
  );
}
