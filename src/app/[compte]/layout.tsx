import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ExternalLink, PawPrint } from "lucide-react";
import { getAccountBySlug, getAccountTheme } from "@/lib/mock";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { POLICE_FONT_VARS, isPoliceId } from "@/lib/fonts";
import type { Locale } from "@/types";

export default async function CompteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ compte: string }>;
}) {
  const { compte } = await params;
  const account = getAccountBySlug(compte);
  if (!account) notFound();

  const theme = getAccountTheme(account.id);
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("common");

  const launchYear = 2026;
  const currentYear = new Date().getFullYear();
  const yearLabel =
    currentYear > launchYear ? `${launchYear} - ${currentYear}` : `${launchYear}`;

  const policeId = theme?.police && isPoliceId(theme.police) ? theme.police : "default";
  const policeFonts = POLICE_FONT_VARS[policeId];

  return (
    <div
      className="flex min-h-screen flex-1 flex-col bg-background font-body"
      style={
        {
          "--account-primary": theme?.couleur_primaire ?? "#221c16",
          "--account-secondary": theme?.couleur_secondaire ?? "#efe9e0",
          "--font-heading": policeFonts.heading,
          "--font-body": policeFonts.body,
        } as React.CSSProperties
      }
    >
      <header className="sticky top-0 z-10 border-b border-border bg-(--account-secondary)/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href={`/${account.slug}`}
            className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80"
          >
            {theme?.logo_url ? (
              <Image
                src={theme.logo_url}
                alt={`Logo ${account.nom_affichage}`}
                width={44}
                height={44}
                unoptimized={theme.logo_url.startsWith("data:")}
                className="h-9 w-9 shrink-0 rounded-full border-2 border-white object-cover shadow-sm sm:h-11 sm:w-11"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white bg-(--account-primary) text-white shadow-sm sm:h-11 sm:w-11">
                <PawPrint className="h-5 w-5" />
              </span>
            )}
            <span className="truncate font-heading text-base font-medium tracking-tight text-foreground sm:text-xl">
              {account.nom_affichage}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {theme?.lien_retour_site && (
              <a
                href={theme.lien_retour_site}
                className="inline-flex items-center gap-1.5 rounded-full border border-(--account-primary) bg-white px-3 py-2 text-sm font-semibold text-(--account-primary) shadow-sm transition-colors hover:bg-(--account-primary) hover:text-white sm:px-4"
              >
                <span className="hidden sm:inline">{t("backToSite")}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <LocaleSwitcher current={locale} />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-(--account-secondary) px-6 py-8 text-center">
        <p className="text-sm text-foreground">{t("createdWith", { year: yearLabel })}</p>
      </footer>
    </div>
  );
}
