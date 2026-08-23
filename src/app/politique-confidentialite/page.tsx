import { cookies } from "next/headers";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { LegalSections } from "@/components/LegalSections";
import type { Locale } from "@/types";

export default async function PolitiqueConfidentialitePage() {
  const t = await getTranslations("admin.legalPage");
  const tLogin = await getTranslations("admin.login");
  const locale = (await getLocale()) as Locale;
  const theme = (await cookies()).get("THEME_PREFERENCE")?.value;

  return (
    <div
      className="app-theme-scope min-h-screen bg-background"
      data-theme={theme === "light" ? "light" : theme === "dark" ? "dark" : undefined}
    >
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between">
          <Link href="/">
            <ZoodomoLogo width={120} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle label={tLogin("themeToggle")} />
            <LocaleSwitcher current={locale} />
          </div>
        </div>
        <h1 className="mt-8 font-heading text-3xl font-medium tracking-tight text-foreground">
          {t("privacyTitle")}
        </h1>
        <p className="mt-4 text-sm text-foreground">{t("lastUpdated")}</p>

        <LegalSections sections={t.raw("privacySections")} />

        <h2 className="mt-8 font-heading text-xl font-medium tracking-tight text-foreground">
          {t("cookiesSectionTitle")}
        </h2>
        <p className="mt-3 text-foreground">{t("cookiesIntro")}</p>
        <ul className="mt-4 space-y-3">
          <li className="text-sm text-foreground">
            <span className="font-mono font-semibold">NEXT_LOCALE</span> : {t("cookieNextLocale")}
          </li>
          <li className="text-sm text-foreground">
            <span className="font-mono font-semibold">THEME_PREFERENCE</span> : {t("cookieTheme")}
          </li>
          <li className="text-sm text-foreground">
            <span className="font-mono font-semibold">sb-*-auth-token</span> : {t("cookieAuth")}
          </li>
          <li className="text-sm text-foreground">
            <span className="font-mono font-semibold">zoodomo_admin_session</span> : {t("cookieAdminSession")}
          </li>
          <li className="text-sm text-foreground">
            <span className="font-mono font-semibold">COOKIE_CONSENT_ACK</span> : {t("cookieConsentAck")}
          </li>
        </ul>

        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
