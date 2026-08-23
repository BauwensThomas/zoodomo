import { cookies } from "next/headers";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ForgotPasswordFields } from "../ForgotPasswordFields";
import type { Locale } from "@/types";

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

  return (
    <div
      className="app-theme-scope bg-background"
      data-theme={theme === "light" ? "light" : theme === "dark" ? "dark" : undefined}
    >
      <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 py-10 text-center">
        <div className="flex w-full items-center justify-between">
          <Link href="/">
            <ZoodomoLogo width={130} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle label={tLogin("themeToggle")} />
            <LocaleSwitcher current={locale} />
          </div>
        </div>

        <ForgotPasswordFields initialEmail={email ?? ""} linkInvalid={erreur === "lien_invalide"} />

        <Link
          href="/"
          className="mt-8 text-sm font-medium text-foreground underline transition-opacity hover:opacity-70"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </div>
  );
}
