import { cookies } from "next/headers";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { MONTHLY_PRICE_EUR, ANNUAL_PRICE_EUR } from "@/lib/pricing";
import { TRIAL_DAYS } from "@/lib/mock/helpers";
import type { Locale } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs : Zoodomo",
  description: `Un seul abonnement, ${MONTHLY_PRICE_EUR} euros par mois ou ${ANNUAL_PRICE_EUR} euros par an, toutes les fonctionnalités incluses. Essai gratuit de ${TRIAL_DAYS} jours, sans carte bancaire.`,
  openGraph: {
    title: "Tarifs Zoodomo",
    description: `Un seul abonnement, toutes les fonctionnalités incluses. Essai gratuit de ${TRIAL_DAYS} jours.`,
    url: "https://www.zoodomo.com/tarifs",
    siteName: "Zoodomo",
    locale: "fr_FR",
    type: "website",
  },
};

// Page tarifs publique, dédiée (pas juste un ancrage sur la page de connexion) : demandée par
// Paddle lors de la vérification du compte marchand (le formulaire de vérification exige un
// lien distinct du domaine racine), voir docs/DECISIONS.md. Cartes mensuel/annuel façon
// tableau comparatif (demande utilisateur, capture d'écran de référence Supabase), couleur
// d'accent verte reprise de FeatureHighlights/SitePreviewMockup (#2f6b4f, déjà la couleur de
// marque des pages publiques). Réutilise les traductions existantes (admin.trialPopup pour
// les libellés de prix, admin.login pour la liste des fonctionnalités) plutôt que d'en
// dupliquer, seul le contenu propre à cette page a son propre namespace admin.pricingPage.
export default async function TarifsPage() {
  const t = await getTranslations("admin.pricingPage");
  const tTrial = await getTranslations("admin.trialPopup");
  const tLogin = await getTranslations("admin.login");
  const locale = (await getLocale()) as Locale;
  const theme = (await cookies()).get("THEME_PREFERENCE")?.value;

  const features = [
    tLogin("featurePersonalize"),
    tLogin("featureLanguages"),
    tLogin("featureShare"),
    tLogin("featureReminders"),
  ];

  const ACCENT = "#2f6b4f";

  return (
    <div
      className="app-theme-scope min-h-screen bg-background"
      data-theme={theme === "light" ? "light" : theme === "dark" ? "dark" : undefined}
    >
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <Link href="/">
            <ZoodomoLogo width={120} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle label={tLogin("themeToggle")} />
            <LocaleSwitcher current={locale} />
          </div>
        </div>

        <h1 className="mt-5 font-heading text-3xl font-medium tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-2 text-base text-foreground">{t("subtitle")}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {/* Essai gratuit : pas un plan permanent, juste la période d'essai avant paiement.
              Le bloc titre/prix a une hauteur fixe (min-h) identique sur les 3 cartes pour que
              les boutons "Choisir" démarrent tous à la même hauteur, que la carte annuelle ait
              ou non une ligne de texte en plus (mois offerts). */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="min-h-22">
              <p className="text-xs font-semibold tracking-wide" style={{ color: ACCENT }}>
                {t("trialLabel").toUpperCase()}
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                0 €
                <span className="text-base font-medium text-foreground">
                  {" "}
                  / {t("trialDuration", { days: TRIAL_DAYS })}
                </span>
              </p>
            </div>

            <Link
              href="/inscription"
              className="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              {t("trialCta")}
            </Link>

            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                <span className="text-sm font-medium text-foreground">{t("noCardRequired")}</span>
              </div>
              {features.map((label) => (
                <div key={label} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mensuel */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="min-h-22">
              <p className="text-xs font-semibold tracking-wide" style={{ color: ACCENT }}>
                {tTrial("monthlyLabel").toUpperCase()}
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {MONTHLY_PRICE_EUR} €
                <span className="text-base font-medium text-foreground"> / {t("perMonth")}</span>
              </p>
            </div>

            <Link
              href="/inscription"
              className="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              {tTrial("choose")}
            </Link>

            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {features.map((label) => (
                <div key={label} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Annuel, mis en avant */}
          <div className="rounded-2xl border-2 p-5" style={{ borderColor: ACCENT }}>
            <div className="min-h-22">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wide" style={{ color: ACCENT }}>
                  {tTrial("annualLabel").toUpperCase()}
                </p>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {t("mostPopular")}
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {ANNUAL_PRICE_EUR} €
                <span className="text-base font-medium text-foreground"> / {t("perYear")}</span>
              </p>
              <p className="mt-1 text-xs text-foreground">{tTrial("annualHint")}</p>
            </div>

            <Link
              href="/inscription"
              className="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              {tTrial("choose")}
            </Link>

            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {features.map((label) => (
                <div key={label} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-foreground">{t("freeTrialNote")}</p>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
