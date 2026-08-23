import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2, Plus } from "lucide-react";
import { getSessionAccount } from "@/lib/mock/auth";
import { createClient } from "@/lib/supabase/server";
import {
  listAnimauxByAccountAll,
  getEspeceById,
  getViewCount,
  visibiliteState,
  isAnimalVisiblePublicly,
} from "@/lib/mock";
import { deleteAnimalAction, changeStatutAction } from "../actions";
import { FichesSections, type FichesSectionConfig } from "@/components/FichesSections";
import { AutoDismiss } from "@/components/AutoDismiss";
import type { FicheRow } from "@/components/FichesTable";
import type { Locale } from "@/types";

export default async function MesFichesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const { saved } = await searchParams;
  const t = await getTranslations("admin.fiches");
  const tDashboard = await getTranslations("admin.dashboard");
  const tSpecies = await getTranslations("species");
  const locale = (await getLocale()) as Locale;
  const dateLocale = locale === "en" ? "en-GB" : locale;

  const supabase = await createClient();
  const animaux = await listAnimauxByAccountAll(supabase, account.id);
  const vuesParAnimal = new Map(
    await Promise.all(animaux.map(async (a) => [a.id, await getViewCount(supabase, a.id)] as const))
  );

  const rows: FicheRow[] = animaux.map((animal) => {
    const espece = getEspeceById(animal.espece_id);
    const especeNom = espece
      ? tSpecies.has(espece.slug)
        ? tSpecies(espece.slug)
        : espece.nom
      : "-";
    const visResult = visibiliteState(animal);
    return {
      id: animal.id,
      nom: animal.nom,
      especeNom,
      race: animal.race,
      sexe: animal.sexe,
      sterilise: animal.sterilise,
      annee_naissance: animal.annee_naissance,
      date_naissance: animal.date_naissance,
      numero_identification: animal.numero_identification,
      date_arrivee: animal.date_arrivee,
      origine: animal.origine,
      prix: animal.prix,
      vues: vuesParAnimal.get(animal.id) ?? 0,
      statut: animal.statut,
      created_at: animal.created_at,
      updated_at: animal.updated_at,
      date_reservation: animal.date_reservation,
      date_adoption: animal.date_adoption,
      visState: visResult.state,
      visDays: visResult.state === "days" ? visResult.days : undefined,
      // Une fiche adoptée dont la fenêtre de 7 jours est dépassée n'est plus visible
      // publiquement (voir isAnimalVisiblePublicly) : pas de lien vers une page qui 404.
      publicUrl:
        espece && isAnimalVisiblePublicly(animal)
          ? `/${account.slug}/${espece.slug}/${animal.slug}`
          : null,
      deleteAction: deleteAnimalAction.bind(null, animal.id),
      setDisponibleAction: changeStatutAction.bind(null, animal.id, "disponible"),
      setReserveAction: changeStatutAction.bind(null, animal.id, "reserve"),
      setAdopteAction: changeStatutAction.bind(null, animal.id, "adopte"),
    };
  });

  const exportRows = rows.map((r) => ({
    nom: r.nom,
    especeNom: r.especeNom,
    race: r.race,
    sexe: r.sexe,
    sterilise: r.sterilise,
    annee_naissance: r.annee_naissance,
    date_naissance: r.date_naissance,
    numero_identification: r.numero_identification,
    date_arrivee: r.date_arrivee,
    origine: r.origine,
    prix: r.prix,
    statut: r.statut,
    vues: r.vues,
    created_at: r.created_at,
    updated_at: r.updated_at,
    date_reservation: r.date_reservation,
    date_adoption: r.date_adoption,
    visState: r.visState,
    visDays: r.visDays,
  }));

  const sections: FichesSectionConfig[] = [
    {
      statut: "disponible",
      title: tDashboard("statAvailable"),
      dateColumn: null,
      defaultSortKey: "created_at",
    },
    {
      statut: "reserve",
      title: tDashboard("statReserved"),
      dateColumn: { labelKey: "colReservedDate", field: "date_reservation", showVisibleDays: false },
      defaultSortKey: "date_reservation",
    },
    {
      statut: "adopte",
      title: tDashboard("statAdopted"),
      dateColumn: { labelKey: "colAdoptedDate", field: "date_adoption", showVisibleDays: true },
      defaultSortKey: "date_adoption",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
          {t("title")}
        </h1>
        <Link
          href="/espace/fiches/nouveau"
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {t("add")}
        </Link>
      </div>

      {(saved === "created" || saved === "updated") && (
        <AutoDismiss>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {saved === "created" ? t("createdConfirmation") : t("savedConfirmation")}
          </p>
        </AutoDismiss>
      )}

      {animaux.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground">
          {t("empty")}
        </p>
      ) : (
        <FichesSections
          rows={rows}
          exportRows={exportRows}
          sections={sections}
          dateLocale={dateLocale}
          accountName={account.nom_affichage}
        />
      )}
    </div>
  );
}
