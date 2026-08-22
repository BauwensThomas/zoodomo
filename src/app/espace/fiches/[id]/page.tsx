import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { getSessionAccount } from "@/lib/mock/auth";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const animal = await getAnimalById(supabase, id);
  if (!animal || animal.account_id !== account.id) notFound();
  // Une fiche réservée ou adoptée ne peut plus être modifiée : il faut d'abord la
  // remettre "disponible" (icône dédiée dans "Mes fiches") avant de pouvoir l'éditer.
  if (animal.statut !== "disponible") redirect("/espace/fiches");

  const [badges, photos] = await Promise.all([
    getBadgesForAnimal(supabase, animal.id),
    getPhotosForAnimal(supabase, animal.id),
  ]);

  const t = await getTranslations("admin.form");
  const updateWithId = updateAnimalAction.bind(null, animal.id);

  return (
    <div>
      <Link
        href="/espace/fiches"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToList")}
      </Link>
      <h1 className="mt-3 font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("editTitle", { name: animal.nom })}
      </h1>
      <div className="mt-6">
        <FicheForm
          action={updateWithId}
          especes={mockEspeces}
          languesActives={account.langues_actives}
          animal={animal}
          badges={badges}
          photos={photos}
          submitLabel={t("editSubmit")}
        />
      </div>
    </div>
  );
}
