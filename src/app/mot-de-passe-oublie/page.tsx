import { cookies } from "next/headers";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SitePreviewMockup } from "@/components/SitePreviewMockup";
import { FeatureHighlights } from "@/components/FeatureHighlights";
import { TestimonialCarousel } from "@/components/TestimonialCarousel";
import { ForgotPasswordFields } from "../ForgotPasswordFields";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicRatingSummary, listBestComments } from "@/lib/mock";
import type { Locale } from "@/types";

/** Même habillage à deux colonnes que `/` et `/inscription` (aperçu du site public + avis),
 * décision utilisateur du 2026-08-25 : cette page (et l'état "lien envoyé" du même
 * composant `ForgotPasswordFields`) restait sur une seule colonne étroite, incohérent avec
 * le reste du flux de connexion/inscription. */
export default async function MotDePasseOubliePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; erreur?: string }>;
}) {
  const { email, erreur } = await searchParams;
  const t = await getTranslations("admin.forgotPassword");
  const tLogin = await getTranslations("admin.login");
  const locale = (await getLocale()) as Locale;
  const theme = (await cookies()).get("THEME_PREFERENCE")?.value;

  const admin = createAdminClient();
  const ratingSummary = await getPublicRatingSummary(admin);
  const testimonials = ratingSummary ? await listBestComments(admin) : [];

  return (
    <div
      className="app-theme-scope"
      data-theme={theme === "light" ? "light" : theme === "dark" ? "dark" : undefined}
    >
      <div className="grid min-h-screen bg-background lg:h-screen lg:grid-cols-[5fr_7fr] lg:overflow-hidden">
        <div className="flex flex-col px-6 py-6 sm:px-12 sm:py-8 lg:overflow-y-auto">
          <div className="flex items-center justify-between">
            <Link href="/">
              <ZoodomoLogo width={130} />
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle label={tLogin("themeToggle")} />
              <LocaleSwitcher current={locale} />
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="w-full max-w-sm">
              <ForgotPasswordFields initialEmail={email ?? ""} linkInvalid={erreur === "lien_invalide"} />

              <Link
                href="/"
                className="mt-8 inline-block text-sm font-medium text-foreground underline transition-opacity hover:opacity-70"
              >
                {t("backToLogin")}
              </Link>
            </div>
          </div>
        </div>

        <div className="relative hidden overflow-x-hidden border-l border-border bg-muted lg:flex lg:overflow-y-auto lg:px-16 lg:py-4">
          <div className="lg:m-auto lg:flex lg:w-full lg:flex-col lg:gap-3">
            <div>
              <h2 className="font-heading text-3xl font-medium leading-tight tracking-tight text-foreground">
                {tLogin("heroTitle")}
              </h2>
              <p className="mt-3 text-sm text-foreground">{tLogin("heroSubtitle")}</p>
              <div className="mt-4">
                <FeatureHighlights />
              </div>
            </div>

            <SitePreviewMockup />

            {ratingSummary && (
              <TestimonialCarousel
                ratingLabel={tLogin("testimonialsRating", {
                  average: ratingSummary.average.toFixed(1),
                  count: ratingSummary.count,
                })}
                average={ratingSummary.average}
                comments={testimonials}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
