import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { getSessionAccount } from "@/lib/mock/auth";
import { mockEspeces } from "@/lib/mock";
import { FicheForm } from "../FicheForm";
import { createAnimalAction } from "../../actions";

export default async function NouvelleFichePage() {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const t = await getTranslations("admin.form");

  return (
    <div>
      <Link
        href="/espace/fiches"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToList")}
      </Link>
      <h1 className="mt-2 font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("newTitle")}
      </h1>
      <div className="mt-4">
        <FicheForm
          action={createAnimalAction}
          accountId={account.id}
          especes={mockEspeces}
          languesActives={account.langues_actives}
          submitLabel={t("createSubmit")}
        />
      </div>
    </div>
  );
}
