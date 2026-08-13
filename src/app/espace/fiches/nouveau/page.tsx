import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
      <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("newTitle")}
      </h1>
      <div className="mt-6 max-w-3xl">
        <FicheForm
          action={createAnimalAction}
          especes={mockEspeces}
          languesActives={account.langues_actives}
          submitLabel={t("createSubmit")}
        />
      </div>
    </div>
  );
}
