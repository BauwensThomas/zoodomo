"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";

export default function ConditionsUtilisationPage() {
  const t = useTranslations("admin.legalPage");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/">
        <ZoodomoLogo width={120} />
      </Link>
      <h1 className="mt-8 font-heading text-3xl font-medium tracking-tight text-foreground">
        {t("termsTitle")}
      </h1>
      <p className="mt-4 text-foreground/60">{t("placeholder")}</p>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>
    </div>
  );
}
