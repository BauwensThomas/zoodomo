import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
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

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-10 text-center">
      <Link href="/">
        <ZoodomoLogo width={140} />
      </Link>

      <VerificationWaitingFields email={email} linkInvalid={erreur === "lien_invalide"} />

      <Link
        href="/"
        className="mt-8 text-sm font-medium text-foreground underline transition-opacity hover:opacity-70"
      >
        {t("backToLogin")}
      </Link>
    </div>
  );
}
