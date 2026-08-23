"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SitePreviewMockup } from "@/components/SitePreviewMockup";
import { FeatureHighlights } from "@/components/FeatureHighlights";
import { PasswordRequirements } from "@/components/PasswordRequirements";
import { isPasswordStrongEnough } from "@/lib/passwordStrength";
import type { Locale } from "@/types";
import { updatePasswordAction, type UpdatePasswordState } from "./actions";

const initialState: UpdatePasswordState = {};

/** Même raison que `blockClipboard` dans `InscriptionForm.tsx` : empêcher de recopier la
 * même faute de frappe dans les deux champs sans s'en rendre compte. */
function blockClipboard(e: React.ClipboardEvent<HTMLInputElement>) {
  e.preventDefault();
}

/**
 * Même habillage de page que `/inscription`/`/` (colonne de formulaire + volet hero à
 * droite, mêmes espacements) plutôt que la mise en page centrée d'origine, demande
 * utilisateur explicite ("les espaces comme les autres pages de connexion").
 */
export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatchError, setMismatchError] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const t = useTranslations("admin.resetPassword");
  const tLogin = useTranslations("admin.login");
  const locale = useLocale() as Locale;

  return (
    <div className="grid min-h-screen bg-background lg:h-screen lg:grid-cols-[5fr_7fr] lg:overflow-hidden">
      <div className="flex flex-col px-6 py-6 sm:px-12 sm:py-8 lg:overflow-y-auto">
        <div className="flex items-center justify-between">
          <ZoodomoLogo width={130} />
          <div className="flex items-center gap-2">
            <ThemeToggle label={tLogin("themeToggle")} />
            <LocaleSwitcher current={locale} />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-foreground">{t("subtitle")}</p>

            <form
              action={formAction}
              onSubmit={(e) => {
                if (!isPasswordStrongEnough(password)) {
                  e.preventDefault();
                  return;
                }
                if (password !== confirmPassword) {
                  e.preventDefault();
                  setMismatchError(true);
                } else {
                  setMismatchError(false);
                }
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  {t("newPassword")}
                </label>
                <div
                  className="relative mt-1.5"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setPasswordFocused(false);
                    }
                  }}
                >
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onPaste={blockClipboard}
                    onCopy={blockClipboard}
                    onCut={blockClipboard}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? tLogin("hidePassword") : tLogin("showPassword")}
                    className="absolute right-0 top-0 flex h-full w-10 cursor-pointer items-center justify-center text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {passwordFocused && (
                    <div className="absolute left-0 top-full z-10 mt-2 w-full rounded-xl border border-border bg-card p-3 shadow-md">
                      <PasswordRequirements
                        password={password}
                        minLengthLabel={t("passwordMinLength")}
                        digitLabel={t("passwordNeedsDigit")}
                        specialCharLabel={t("passwordNeedsSpecialChar")}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                  {t("confirmNewPassword")}
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setMismatchError(false);
                    }}
                    onPaste={blockClipboard}
                    onCopy={blockClipboard}
                    onCut={blockClipboard}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? tLogin("hidePassword") : tLogin("showPassword")}
                    className="absolute right-0 top-0 flex h-full w-10 cursor-pointer items-center justify-center text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {mismatchError && <p className="text-sm text-red-600">{t("passwordMismatchError")}</p>}
              {state.error && <p className="text-sm text-red-600">{state.error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full cursor-pointer rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? t("submitting") : t("submit")}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-x-hidden border-l border-border bg-muted lg:flex lg:overflow-y-auto lg:px-16 lg:py-5">
        <div className="lg:m-auto lg:flex lg:w-full lg:flex-col lg:gap-4">
          <div>
            <h2 className="font-heading text-4xl font-medium leading-tight tracking-tight text-foreground">
              {tLogin("heroTitle")}
            </h2>
            <p className="mt-4 text-foreground">{tLogin("heroSubtitle")}</p>
            <div className="mt-5">
              <FeatureHighlights />
            </div>
          </div>

          <SitePreviewMockup />
        </div>
      </div>
    </div>
  );
}
