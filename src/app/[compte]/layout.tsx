import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ExternalLink, PawPrint } from "lucide-react";
import { getAccountBySlug, getAccountTheme } from "@/lib/mock";
import { isPublicPageBlocked } from "@/lib/mock/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const supabase = createAdminClient();
  const account = await getAccountBySlug(supabase, compte);
  if (!account) notFound();

  const theme = await getAccountTheme(supabase, account.id);
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
      <header className="sticky top-0 z-10 border-b border-border bg-(--account-secondary)/90 backdrop-blur print:static">
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

          <div className="print:hidden flex shrink-0 items-center gap-2">
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

          {/* Coordonnées du compte : masquées à l'écran (déjà affichées ailleurs, sur
              `/[compte]`), affichées uniquement à l'impression, dans l'en-tête existant
              plutôt que dans un bloc à part qui redirait le nom du compte une seconde fois. */}
          <div className="hidden shrink-0 flex-col items-end gap-0.5 text-xs text-foreground print:flex">
            {account.contact_email_public && <span>{account.contact_email_public}</span>}
            {account.contact_telephone_public && <span>{account.contact_telephone_public}</span>}
            {account.adresse && account.adresse_visible && <span>{account.adresse}</span>}
            {account.numero_entreprise && account.numero_entreprise_visible && (
              <span>{account.numero_entreprise}</span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Essai gratuit + délai de grâce épuisés sans passer à un abonnement (voir
            `isPublicPageBlocked`, docs/DECISIONS.md) : message d'indisponibilité plutôt que
            le contenu normal, mais en-tête/pied de page du compte conservés (confirme au
            visiteur qu'il est au bon endroit, juste temporairement indisponible), et surtout
            pas un 404 muet pour un lien déjà partagé. */}
        {isPublicPageBlocked(account) ? (
          <p className="mx-auto max-w-2xl px-6 py-16 text-center text-foreground">
            {t("accountUnavailable")}
          </p>
        ) : (
          children
        )}
      </main>

      <footer className="print:hidden border-t border-border bg-(--account-secondary) px-6 py-8 text-center">
        <p className="text-sm text-foreground">{t("createdWith", { year: yearLabel })}</p>
      </footer>
    </div>
  );
}
