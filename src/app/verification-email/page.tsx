import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VerificationWaitingFields } from "../VerificationWaitingFields";

export default async function VerificationEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; erreur?: string }>;
}) {
  const { email, erreur } = await searchParams;
  // Pas de session à ce stade (voir `src/app/signup-actions.ts` : aucune session tant que
  // l'email n'est pas confirmé), donc pas de garde-fou basé sur un compte connecté ici. Sans
  // email en paramètre (accès direct à l'URL), rien à afficher d'utile : retour à l'inscription.
  if (!email) redirect("/inscription");

  const t = await getTranslations("admin.verifyEmail");
  const tLogin = await getTranslations("admin.login");
  const theme = (await cookies()).get("THEME_PREFERENCE")?.value;

  return (
    <div
      className="app-theme-scope bg-background"
      data-theme={theme === "light" ? "light" : theme === "dark" ? "dark" : undefined}
    >
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-10 text-center">
        <div className="flex w-full items-center justify-between">
          <Link href="/">
            <ZoodomoLogo width={140} />
          </Link>
          <ThemeToggle label={tLogin("themeToggle")} />
        </div>

        <VerificationWaitingFields email={email} linkInvalid={erreur === "lien_invalide"} />

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
