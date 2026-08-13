import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionAccount } from "@/lib/mock/auth";
import {
  mockEspeces,
  getAnimalById,
  getBadgesForAnimal,
  getPhotosForAnimal,
} from "@/lib/mock";
import { FicheForm } from "../FicheForm";
import { updateAnimalAction } from "../../actions";

export default async function EditerFichePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const animal = getAnimalById(id);
  if (!animal || animal.account_id !== account.id) notFound();

  const t = await getTranslations("admin.form");
  const updateWithId = updateAnimalAction.bind(null, animal.id);

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("editTitle", { name: animal.nom })}
      </h1>
      <div className="mt-6 max-w-3xl">
        <FicheForm
          action={updateWithId}
          especes={mockEspeces}
          languesActives={account.langues_actives}
          animal={animal}
          badges={getBadgesForAnimal(animal.id)}
          photos={getPhotosForAnimal(animal.id)}
          submitLabel={t("editSubmit")}
        />
      </div>
    </div>
  );
}
