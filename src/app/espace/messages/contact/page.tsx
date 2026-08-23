import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { getSessionAccount } from "@/lib/mock/auth";
import { ContactWebmasterForm } from "../ContactWebmasterForm";

export default async function ContactWebmasterPage() {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const t = await getTranslations("admin.messages");

  return (
    <div>
      <Link
        href="/espace/messages"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:opacity-70"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("title")}
      </Link>

      <h1 className="mt-3 font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("contactTitle")}
      </h1>

      <div className="mt-4">
        <ContactWebmasterForm
          reasonLabel={t("contactReasonLabel")}
          reasonBug={t("contactReasonBug")}
          reasonCompte={t("contactReasonCompte")}
          reasonSuggestion={t("contactReasonSuggestion")}
          reasonAutre={t("contactReasonAutre")}
          subjectLabel={t("contactSubjectLabel")}
          bodyLabel={t("contactBodyLabel")}
          photoLabel={t("contactPhotoLabel")}
          photoDropLabel={t("contactPhotoDropLabel")}
          photoMaxReached={t("contactPhotoMaxReached")}
          photoRemoveAria={t("contactPhotoRemoveAria")}
          send={t("contactSend")}
          sentConfirmation={t("contactSentConfirmation")}
        />
      </div>
    </div>
  );
}
