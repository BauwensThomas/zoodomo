import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ForgotPasswordFields } from "../ForgotPasswordFields";
import type { Locale } from "@/types";

export default async function MotDePasseOubliePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; erreur?: string }>;
}) {
  const { email, erreur } = await searchParams;
  const t = await getTranslations("admin.forgotPassword");
  const locale = (await getLocale()) as Locale;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex w-full items-center justify-between">
        <Link href="/">
          <ZoodomoLogo width={130} />
        </Link>
        <LocaleSwitcher current={locale} />
      </div>

      <ForgotPasswordFields initialEmail={email ?? ""} linkInvalid={erreur === "lien_invalide"} />

      <Link
        href="/"
        className="mt-8 text-sm font-medium text-foreground underline transition-opacity hover:opacity-70"
      >
        {t("backToLogin")}
      </Link>
    </div>
  );
}
