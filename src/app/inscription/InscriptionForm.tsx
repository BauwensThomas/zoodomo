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
import { VerificationWaitingFields } from "../VerificationWaitingFields";
import { PasswordRequirements } from "@/components/PasswordRequirements";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { isPasswordStrongEnough } from "@/lib/passwordStrength";
import type { Locale } from "@/types";
import { signupAction, type SignupState } from "../signup-actions";

const initialState: SignupState = {};

/** Bloque coller/copier/couper sur les champs mot de passe : voir le commentaire sur
 * `confirmPassword` dans `InscriptionPage` pour la raison (empêcher de recopier la même
 * faute de frappe dans les deux champs). */
function blockClipboard(e: React.ClipboardEvent<HTMLInputElement>) {
  e.preventDefault();
}

export function InscriptionForm({ signupsEnabled }: { signupsEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatchError, setMismatchError] = useState(false);
  // Popup des règles de mot de passe : affiché seulement pendant que le champ (ou son bouton
  // afficher/masquer) a le focus, demande utilisateur explicite plutôt que toujours visible.
  const [passwordFocused, setPasswordFocused] = useState(false);
  const t = useTranslations("admin.signup");
  const tLogin = useTranslations("admin.login");
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
            {state.submitted ? (
              <VerificationWaitingFields email={state.email ?? ""} linkInvalid={false} />
            ) : !signupsEnabled ? (
              <>
                <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
                  {t("closedTitle")}
                </h1>
                <p className="mt-2 text-sm text-foreground">{t("closedBody")}</p>
              </>
            ) : (
              <>
                <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
                  {t("title")}
                </h1>
                <p className="mt-2 text-sm text-foreground">{t("subtitle")}</p>

                <form
                  action={formAction}
                  onSubmit={(e) => {
                    // Validation cliente : mêmes deux champs déjà en état local (`password`/
                    // `confirmPassword`), comparés avant de laisser passer la soumission vers
                    // l'action serveur. Le copier-coller est bloqué sur les deux champs
                    // (`blockClipboard`) pour que cette comparaison ait un sens : sans ça, un
                    // visiteur pourrait recopier la même faute de frappe dans les deux champs et
                    // passer la vérification sans jamais s'en rendre compte, voir docs/TODO.md.
                    // Robustesse du mot de passe (8 caractères, un chiffre, un caractère
                    // spécial) revérifiée ici en plus de l'affichage en direct de
                    // `PasswordRequirements`, pour bloquer un envoi malgré tout.
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
                  className="mt-6 space-y-3"
                >
                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-foreground">
                      {t("name")}
                    </label>
                    <input
                      id="nom"
                      name="nom"
                      required
                      className="mt-1.5 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground">
                      {t("email")}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className="mt-1.5 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-foreground">
                      {t("password")}
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
                        className="w-full rounded-xl border border-border px-3.5 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? tLogin("hidePassword") : tLogin("showPassword")}
                        className="absolute right-0 top-0 flex h-full w-10 cursor-pointer items-center justify-center text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      {passwordFocused && (
                        <div className="absolute left-0 top-full z-10 mt-2 w-full rounded-xl border border-border bg-white p-3 shadow-md">
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
                      {t("confirmPassword")}
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
                        className="w-full rounded-xl border border-border px-3.5 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-foreground"
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

                  <TurnstileWidget action="signup" />

                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full cursor-pointer rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pending ? t("submitting") : t("submit")}
                  </button>
                </form>
              </>
            )}

            {!state.submitted && (
              <>
                <p className="mt-6 text-center text-sm text-foreground">
                  {t("haveAccount")}{" "}
                  <Link href="/" className="font-medium text-foreground underline">
                    {t("login")}
                  </Link>
                </p>

                <p className="mt-6 text-center text-xs text-foreground">
                  {tLogin("legalPrefix")}{" "}
                  <Link href="/conditions-utilisation" className="underline">
                    {tLogin("termsOfService")}
                  </Link>{" "}
                  {tLogin("legalAnd")}{" "}
                  <Link href="/politique-confidentialite" className="underline">
                    {tLogin("privacyPolicy")}
                  </Link>
                  {tLogin("legalSuffix")}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-muted lg:flex lg:flex-col lg:justify-center lg:gap-10 lg:px-16 lg:py-12">
        <div>
          <h2 className="font-heading text-4xl font-medium leading-tight tracking-tight text-foreground">
            {tLogin("heroTitle")}
          </h2>
          <p className="mt-4 text-foreground">{tLogin("heroSubtitle")}</p>
          <div className="mt-8">
            <FeatureHighlights />
          </div>
        </div>

        <SitePreviewMockup />
      </div>
    </div>
  );
}
