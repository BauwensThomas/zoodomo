import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { getSessionAccount } from "@/lib/mock/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRatingLinkForAccount } from "@/lib/mock";
import { RatingForm } from "@/app/avis/[token]/RatingForm";

/** Équivalent de `/avis/[token]` mais accessible depuis l'espace membre déjà connecté (garde
 * la navigation Dashboard/Mes fiches/etc. visible, demande utilisateur du 2026-08-25 : cliquer
 * sur "Laisser un avis" depuis la boîte de réception ne doit pas faire quitter le tableau de
 * bord). Résout le token du compte connecté (`getRatingLinkForAccount`) plutôt que de le lire
 * dans l'URL, réutilise le même `RatingForm` que la page publique. La page publique par token
 * reste inchangée et continue de servir le lien envoyé par email (pas de session requise). */
export default async function EspaceAvisPage() {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const t = await getTranslations("admin.avis");
  const admin = createAdminClient();
  const link = await getRatingLinkForAccount(admin, account.id);

  if (!link) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
          {t("invalidTitle")}
        </h1>
        <p className="mt-3 text-sm text-foreground">{t("invalidBody")}</p>
      </div>
    );
  }

  if (link.alreadyVoted) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
          {t("title", { name: account.nom_affichage })}
        </h1>
        <div className="mt-8 max-w-xl rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          <h2 className="mt-3 font-heading text-lg font-medium text-emerald-900">
            {t("alreadyVotedTitle")}
          </h2>
          <p className="mt-1.5 text-sm text-emerald-900">{t("alreadyVotedBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("title", { name: account.nom_affichage })}
      </h1>
      <div className="max-w-xl">
        <RatingForm
          token={link.token}
          starsLabel={t("starsLabel")}
          commentLabel={t("commentLabel")}
          commentPlaceholder={t("commentPlaceholder")}
          charactersRemainingLabel={t("charactersRemaining")}
          submitButton={t("submitButton")}
          thankYouTitle={t("thankYouTitle")}
          thankYouBody={t("thankYouBody")}
          errorInvalid={t("errorInvalid")}
        />
      </div>
    </div>
  );
}
