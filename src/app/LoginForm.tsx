"use client";

import { Suspense, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SitePreviewMockup } from "@/components/SitePreviewMockup";
import { FeatureHighlights } from "@/components/FeatureHighlights";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { TestimonialCarousel } from "@/components/TestimonialCarousel";
import type { Locale } from "@/types";
import { loginAction, type LoginState } from "./login-actions";
import { ForgotPasswordFields } from "./ForgotPasswordFields";

const initialState: LoginState = {};

interface Testimonial {
  stars: number;
  comment: string;
}

function LoginPageContent({
  ratingSummary,
  testimonials,
}: {
  ratingSummary: { count: number; average: number } | null;
  testimonials: Testimonial[];
}) {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  // Bascule sans navigation entre connexion et mot de passe oublié (`/mot-de-passe-oublie`
  // reste une vraie page à part pour les liens directs/la redirection depuis
  // `src/app/auth/confirm/route.ts`, voir docs/DECISIONS.md), demande utilisateur explicite.
  const [forgotPassword, setForgotPassword] = useState(false);
  const t = useTranslations("admin.login");
  const tForgot = useTranslations("admin.forgotPassword");
  const locale = useLocale() as Locale;

  // Retour depuis `src/app/auth/confirm/route.ts` : email confirmé (juste retaper le mot de
  // passe pour se connecter, plutôt que de dépendre d'une session posée par `verifyOtp` pour
  // ouvrir directement le tableau de bord, demande utilisateur) ou lien expiré/déjà utilisé.
  const emailConfirmed = searchParams.get("confirme") === "1";
  const linkInvalid = searchParams.get("erreur") === "lien_invalide";

  return (
    <div className="grid min-h-screen bg-background lg:h-screen lg:grid-cols-[5fr_7fr] lg:overflow-hidden">
      <div className="flex flex-col px-6 py-6 sm:px-12 sm:py-8 lg:overflow-y-auto">
        <div className="flex items-center justify-between">
          <ZoodomoLogo width={130} />
          <div className="flex items-center gap-2">
            <ThemeToggle label={t("themeToggle")} />
            <LocaleSwitcher current={locale} />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-sm">
            {forgotPassword ? (
              <>
                <ForgotPasswordFields initialEmail={email} linkInvalid={false} />
                <button
                  type="button"
                  onClick={() => setForgotPassword(false)}
                  className="mt-6 cursor-pointer text-sm font-medium text-foreground underline transition-opacity hover:opacity-70"
                >
                  {tForgot("backToLogin")}
                </button>
              </>
            ) : (
              <>
                <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
                  {t("title")}
                </h1>
                <p className="mt-2 text-sm text-foreground">{t("subtitle")}</p>

                {emailConfirmed && (
                  <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {t("emailConfirmed")}
                  </p>
                )}
                {linkInvalid && (
                  <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {t("linkInvalid")}
                  </p>
                )}

                <form action={formAction} className="mt-4 space-y-3">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground">
                      {t("email")}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-foreground">
                      {t("password")}
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                        className="absolute right-0 top-0 flex h-full w-10 cursor-pointer items-center justify-center text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {state.error && (
                    <p className="text-sm text-red-600">
                      {state.error}{" "}
                      <button
                        type="button"
                        onClick={() => setForgotPassword(true)}
                        className="cursor-pointer font-medium underline"
                      >
                        {t("forgotPassword")}
                      </button>
                    </p>
                  )}

                  <TurnstileWidget action="login" />

                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full cursor-pointer rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pending ? t("submitting") : t("submit")}
                  </button>
                </form>

                <p className="mt-4 text-center text-sm text-foreground">
                  {t("noAccount")}{" "}
                  <Link href="/inscription" className="font-medium text-foreground underline">
                    {t("signUp")}
                  </Link>
                </p>

                <p className="mt-4 text-center text-xs text-foreground">
                  {t("legalPrefix")}{" "}
                  <Link href="/conditions-utilisation" className="underline">
                    {t("termsOfService")}
                  </Link>{" "}
                  {t("legalAnd")}{" "}
                  <Link href="/politique-confidentialite" className="underline">
                    {t("privacyPolicy")}
                  </Link>
                  {t("legalSuffix")}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-x-hidden border-l border-border bg-muted lg:flex lg:overflow-y-auto lg:px-16 lg:py-4">
        <div className="lg:m-auto lg:flex lg:w-full lg:flex-col lg:gap-3">
          <div>
            <h2 className="font-heading text-3xl font-medium leading-tight tracking-tight text-foreground">
              {t("heroTitle")}
            </h2>
            <p className="mt-3 text-sm text-foreground">{t("heroSubtitle")}</p>
            <div className="mt-4">
              <FeatureHighlights />
            </div>
          </div>

          <SitePreviewMockup />

          {ratingSummary && (
            <TestimonialCarousel
              ratingLabel={t("testimonialsRating", {
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
  );
}

export function LoginForm({
  ratingSummary,
  testimonials,
}: {
  ratingSummary: { count: number; average: number } | null;
  testimonials: Testimonial[];
}) {
  return (
    <Suspense fallback={null}>
      <LoginPageContent ratingSummary={ratingSummary} testimonials={testimonials} />
    </Suspense>
  );
}
