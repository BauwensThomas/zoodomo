import { cookies } from "next/headers";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRatingByToken } from "@/lib/mock";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import type { Locale } from "@/types";
import { RatingForm } from "./RatingForm";

/** Page publique résolue par token, sans session Supabase (voir
 * `supabase/migrations/0019_account_ratings.sql`, `getRatingByToken`). Rendue dans la langue
 * de `account.langue_interface` (pas celle du visiteur) : le lien a déjà été envoyé dans la
 * bonne langue par `sendRatingRequestsAction`, décision utilisateur du 2026-08-24. Distingue
 * "lien invalide" (token inconnu) de "avis déjà envoyé" (token connu mais déjà soumis) depuis
 * le 2026-08-25 : auparavant les deux cas étaient confondus, retour utilisateur explicite. */
export default async function AvisPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const resolved = await getRatingByToken(admin, token);
  const theme = (await cookies()).get("THEME_PREFERENCE")?.value;
  const dataTheme = theme === "light" ? "light" : theme === "dark" ? "dark" : undefined;

  if (!resolved) {
    const t = await getTranslations("admin.avis");
    return (
      <div className="app-theme-scope min-h-screen bg-background" data-theme={dataTheme}>
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <Link href="/" className="inline-block">
            <ZoodomoLogo width={120} />
          </Link>
          <h1 className="mt-8 font-heading text-2xl font-medium tracking-tight text-foreground">
            {t("invalidTitle")}
          </h1>
          <p className="mt-3 text-sm text-foreground">{t("invalidBody")}</p>
        </div>
      </div>
    );
  }

  const locale = (resolved.account.langue_interface ?? "fr") as Locale;
  const t = await getTranslations({ locale, namespace: "admin.avis" });

  if (resolved.rating.submitted_at) {
    return (
      <div className="app-theme-scope min-h-screen bg-background" data-theme={dataTheme}>
        <div className="mx-auto max-w-xl px-6 py-16">
          <Link href="/" className="inline-block">
            <ZoodomoLogo width={120} />
          </Link>
          <h1 className="mt-8 font-heading text-2xl font-medium tracking-tight text-foreground">
            {t("title", { name: resolved.account.nom_affichage })}
          </h1>
          <div className="mt-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <h2 className="mt-3 font-heading text-lg font-medium text-emerald-900">
              {t("alreadyVotedTitle")}
            </h2>
            <p className="mt-1.5 text-sm text-emerald-900">{t("alreadyVotedBody")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-theme-scope min-h-screen bg-background" data-theme={dataTheme}>
      <div className="mx-auto max-w-xl px-6 py-16">
        <Link href="/" className="inline-block">
          <ZoodomoLogo width={120} />
        </Link>
        <h1 className="mt-8 font-heading text-2xl font-medium tracking-tight text-foreground">
          {t("title", { name: resolved.account.nom_affichage })}
        </h1>
        <RatingForm
          token={token}
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
