"use client";

import { useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { SitePreviewMockup } from "@/components/SitePreviewMockup";
import { FeatureHighlights } from "@/components/FeatureHighlights";
import type { Locale } from "@/types";
import { loginAction, type LoginState } from "./login-actions";

const initialState: LoginState = {};

export default function Home() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations("admin.login");
  const locale = useLocale() as Locale;

  return (
    <div className="grid min-h-screen lg:grid-cols-[5fr_7fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12 sm:py-10">
        <div className="flex items-center justify-between">
          <ZoodomoLogo width={130} />
          <LocaleSwitcher current={locale} />
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-foreground">{t("subtitle")}</p>

            <form action={formAction} className="mt-8 space-y-4">
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
                  className="mt-1.5 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
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
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-foreground"
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

              {state.error && <p className="text-sm text-red-600">{state.error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full cursor-pointer rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? t("submitting") : t("submit")}
              </button>
            </form>

            <div className="mt-8 rounded-xl bg-muted p-4 text-xs text-foreground">
              <p className="font-medium text-foreground">{t("demoTitle")}</p>
              <p className="mt-1">contact@refugequatrepattes.test</p>
              <p>contact@elevageboisfleuri.test</p>
            </div>

            <p className="mt-6 text-center text-sm text-foreground">
              {t("noAccount")}{" "}
              <Link href="/inscription" className="font-medium text-foreground underline">
                {t("signUp")}
              </Link>
            </p>

            <p className="mt-6 text-center text-xs text-foreground">
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
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-muted lg:flex lg:flex-col lg:justify-center lg:gap-10 lg:px-16 lg:py-12">
        <div>
          <h2 className="font-heading text-4xl font-medium leading-tight tracking-tight text-foreground">
            {t("heroTitle")}
          </h2>
          <p className="mt-4 text-foreground">{t("heroSubtitle")}</p>
          <div className="mt-8">
            <FeatureHighlights />
          </div>
        </div>

        <SitePreviewMockup />
      </div>
    </div>
  );
}
