import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { getSessionAccount } from "@/lib/mock/auth";
import { listAnimauxByAccountAll, getEspeceById, getViewCount, visibiliteState } from "@/lib/mock";
import { deleteAnimalAction, changeStatutAction } from "../actions";
import { PdfExportButton } from "@/components/MonthlyPdfExport";
import { FichesTable, type FicheRow } from "@/components/FichesTable";
import type { Locale, StatutAnimal } from "@/types";

export default async function MesFichesPage() {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const t = await getTranslations("admin.fiches");
  const tDashboard = await getTranslations("admin.dashboard");
  const tSpecies = await getTranslations("species");
  const locale = (await getLocale()) as Locale;
  const dateLocale = locale === "en" ? "en-GB" : locale;

  const animaux = listAnimauxByAccountAll(account.id);

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
      vues: getViewCount(animal.id),
      statut: animal.statut,
      created_at: animal.created_at,
      date_reservation: animal.date_reservation,
      date_adoption: animal.date_adoption,
      visState: visResult.state,
      visDays: visResult.state === "days" ? visResult.days : undefined,
      deleteAction: deleteAnimalAction.bind(null, animal.id),
      setDisponibleAction: changeStatutAction.bind(null, animal.id, "disponible"),
      setReserveAction: changeStatutAction.bind(null, animal.id, "reserve"),
      setAdopteAction: changeStatutAction.bind(null, animal.id, "adopte"),
    };
  });

  const exportRows = rows.map((r) => ({
    nom: r.nom,
    especeNom: r.especeNom,
    statut: r.statut,
    vues: r.vues,
    created_at: r.created_at,
    date_reservation: r.date_reservation,
    date_adoption: r.date_adoption,
  }));

  type DateColumn = { labelKey: string; field: "date_adoption" | "date_reservation"; showVisibleDays: boolean };

  const sections: {
    statut: StatutAnimal;
    titleKey: string;
    dateColumn: DateColumn | null;
    defaultSortKey: "created_at" | "date_reservation" | "date_adoption";
  }[] = [
    { statut: "disponible", titleKey: "statAvailable", dateColumn: null, defaultSortKey: "created_at" },
    {
      statut: "reserve",
      titleKey: "statReserved",
      dateColumn: { labelKey: "colReservedDate", field: "date_reservation", showVisibleDays: false },
      defaultSortKey: "date_reservation",
    },
    {
      statut: "adopte",
      titleKey: "statAdopted",
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

      {animaux.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground/60">
          {t("empty")}
        </p>
      ) : (
        sections.map(({ statut, titleKey, dateColumn, defaultSortKey }) => {
          const list = rows.filter((r) => r.statut === statut);
          if (list.length === 0) return null;
          return (
            <section key={statut} className="mt-8 first:mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-lg font-medium text-foreground">
                  {tDashboard(titleKey)} ({list.length})
                </h2>
                <PdfExportButton statut={statut} rows={exportRows} accountName={account.nom_affichage} />
              </div>
              <FichesTable
                rows={list}
                dateColumn={dateColumn}
                dateLocale={dateLocale}
                defaultSortKey={defaultSortKey}
              />
            </section>
          );
        })
      )}
    </div>
  );
}
