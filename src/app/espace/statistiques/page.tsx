import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Eye, CalendarRange, Trophy } from "lucide-react";
import { getSessionAccount } from "@/lib/mock/auth";
import { listAnimauxByAccountAll, getEspeceById, listViewsForAnimalIds } from "@/lib/mock";
import { STATUT_BADGE_CLASS } from "@/lib/statut-badge";
import { StatsFilters } from "@/components/StatsFilters";
import { ViewsChart } from "@/components/ViewsChart";
import type { Animal, Locale } from "@/types";

/** Toutes les dates réelles d'une fiche (hors valeurs nulles), utilisées pour proposer dans
 * le sélecteur d'année une année où il s'est vraiment passé quelque chose sur cette fiche
 * (création, modification, réservation, adoption), pas seulement une année avec des vues. */
function animalDateYears(animal: Animal) {
  return [animal.created_at, animal.updated_at, animal.date_arrivee, animal.date_reservation, animal.date_adoption]
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getFullYear());
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

// Palette qualitative fixe (pas liée aux couleurs de compte `--account-primary`, propres aux
// pages publiques) : l'espace membre n'a pas de thème par compte, une palette générique
// suffit largement pour les quelques espèces qu'un compte gère en pratique.
const SPECIES_PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
  "#84cc16",
];

export default async function StatistiquesPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; year?: string; month?: string; espece?: string; animal?: string }>;
}) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const {
    mode: modeParam,
    year: yearParam,
    month: monthParam,
    espece: especeParam,
    animal: animalParam,
  } = await searchParams;
  const t = await getTranslations("admin.stats");
  const tSpecies = await getTranslations("species");
  const tStatus = await getTranslations("status");
  const locale = (await getLocale()) as Locale;
  const dateLocale = locale === "en" ? "en-GB" : locale;

  const now = new Date();
  const mode: "annuel" | "mensuel" = modeParam === "mensuel" ? "mensuel" : "annuel";
  const year = yearParam && !Number.isNaN(Number(yearParam)) ? Number(yearParam) : now.getFullYear();
  const month =
    monthParam && !Number.isNaN(Number(monthParam))
      ? Math.min(12, Math.max(1, Number(monthParam)))
      : now.getMonth() + 1;

  const allAnimaux = listAnimauxByAccountAll(account.id);

  // Espèces proposées dans le filtre : seulement celles où le compte a vraiment une fiche,
  // pas la liste complète des 19 espèces du brief (la plupart n'auraient aucune fiche).
  const especeIdsWithAnimaux = Array.from(new Set(allAnimaux.map((a) => a.espece_id)));
  const especesDisponibles = especeIdsWithAnimaux
    .map((id) => getEspeceById(id))
    .filter((e): e is NonNullable<ReturnType<typeof getEspeceById>> => !!e)
    .map((e) => ({ id: e.id, nom: tSpecies.has(e.slug) ? tSpecies(e.slug) : e.nom }))
    .sort((a, b) => a.nom.localeCompare(b.nom));

  const especeId =
    especeParam && especeIdsWithAnimaux.includes(especeParam) ? especeParam : "toutes";
  const animauxDeLEspece =
    especeId === "toutes" ? allAnimaux : allAnimaux.filter((a) => a.espece_id === especeId);

  const animalId =
    animalParam && animauxDeLEspece.some((a) => a.id === animalParam) ? animalParam : "tous";
  const animaux = animalId === "tous" ? animauxDeLEspece : animauxDeLEspece.filter((a) => a.id === animalId);

  const animalIds = animaux.map((a) => a.id);
  const views = listViewsForAnimalIds(animalIds);

  // Le sélecteur d'année propose toute année où quelque chose de réel s'est passé pour le
  // périmètre affiché (vue enregistrée, ou fiche créée/modifiée/réservée/adoptée), pas
  // seulement les années avec des vues : sinon une fiche inscrite en 2024 mais sans vue
  // cette année-là ne serait jamais sélectionnable, y compris sur "Tous les animaux".
  const availableYears = Array.from(
    new Set([
      now.getFullYear(),
      ...views.map((v) => new Date(v.viewed_at).getFullYear()),
      ...animaux.flatMap(animalDateYears),
    ])
  ).sort((a, b) => b - a);

  const periodStart = mode === "annuel" ? new Date(year, 0, 1) : new Date(year, month - 1, 1);
  const periodEnd = mode === "annuel" ? new Date(year + 1, 0, 1) : new Date(year, month, 1);
  const viewsInPeriod = views.filter((v) => {
    const d = new Date(v.viewed_at);
    return d >= periodStart && d < periodEnd;
  });

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(dateLocale, { month: "long" }).format(new Date(2000, i, 1))
  );

  // Une barre par espèce à chaque période (mois ou jour), côte à côte : chaque espèce présente
  // dans le périmètre affiché (`animaux`, déjà filtré par espèce/animal) a sa propre couleur
  // et sa propre série dans le graphe, avec la légende qui les associe en dessous.
  const especeNomById = new Map(
    Array.from(new Set(animaux.map((a) => a.espece_id))).map((id) => {
      const espece = getEspeceById(id);
      const nom = espece ? (tSpecies.has(espece.slug) ? tSpecies(espece.slug) : espece.nom) : "-";
      return [id, nom] as const;
    })
  );
  const chartSeries = Array.from(especeNomById.values())
    .sort((a, b) => a.localeCompare(b))
    .map((nom, index) => ({ key: nom, color: SPECIES_PALETTE[index % SPECIES_PALETTE.length] }));
  const animalToEspeceNom = new Map(
    animaux.map((a) => [a.id, especeNomById.get(a.espece_id) ?? "-"] as const)
  );

  function countsByEspece(viewsSubset: typeof viewsInPeriod) {
    const counts: Record<string, number> = {};
    for (const series of chartSeries) counts[series.key] = 0;
    for (const v of viewsSubset) {
      const nom = animalToEspeceNom.get(v.animal_id);
      if (nom) counts[nom] = (counts[nom] ?? 0) + 1;
    }
    return counts;
  }

  const chartData =
    mode === "annuel"
      ? Array.from({ length: 12 }, (_, i) => ({
          label: new Intl.DateTimeFormat(dateLocale, { month: "short" }).format(new Date(2000, i, 1)),
          ...countsByEspece(viewsInPeriod.filter((v) => new Date(v.viewed_at).getMonth() === i)),
        }))
      : Array.from({ length: daysInMonth(year, month) }, (_, i) => ({
          label: String(i + 1),
          ...countsByEspece(viewsInPeriod.filter((v) => new Date(v.viewed_at).getDate() === i + 1)),
        }));

  // Second graphe : annonces créées/réservées/adoptées par période, sur le même périmètre
  // filtré (`animaux`) et la même période sélectionnée que le graphe des vues, mais basé sur
  // les dates de la fiche elle-même (`created_at`/`date_reservation`/`date_adoption`), pas
  // sur des vues.
  const lifecycleSeries: { key: string; color: string; field: "created_at" | "date_reservation" | "date_adoption" }[] = [
    { key: t("seriesCreated"), color: "#10b981", field: "created_at" },
    { key: t("seriesReserved"), color: "#f59e0b", field: "date_reservation" },
    { key: t("seriesAdopted"), color: "#f43f5e", field: "date_adoption" },
  ];
  function lifecycleCountsForBucket(matchesBucket: (d: Date) => boolean) {
    const counts: Record<string, number> = {};
    for (const s of lifecycleSeries) counts[s.key] = 0;
    for (const animal of animaux) {
      for (const s of lifecycleSeries) {
        const value = animal[s.field];
        if (value) {
          const d = new Date(value);
          if (d >= periodStart && d < periodEnd && matchesBucket(d)) counts[s.key] += 1;
        }
      }
    }
    return counts;
  }
  const lifecycleChartData =
    mode === "annuel"
      ? Array.from({ length: 12 }, (_, i) => ({
          label: new Intl.DateTimeFormat(dateLocale, { month: "short" }).format(new Date(2000, i, 1)),
          ...lifecycleCountsForBucket((d) => d.getMonth() === i),
        }))
      : Array.from({ length: daysInMonth(year, month) }, (_, i) => ({
          label: String(i + 1),
          ...lifecycleCountsForBucket((d) => d.getDate() === i + 1),
        }));

  const viewsByAnimal = new Map<string, number>();
  for (const v of viewsInPeriod) {
    viewsByAnimal.set(v.animal_id, (viewsByAnimal.get(v.animal_id) ?? 0) + 1);
  }

  const rows = animaux
    .map((animal) => {
      const espece = getEspeceById(animal.espece_id);
      const especeNom = espece ? (tSpecies.has(espece.slug) ? tSpecies(espece.slug) : espece.nom) : "-";
      return { animal, especeNom, count: viewsByAnimal.get(animal.id) ?? 0 };
    })
    .sort((a, b) => b.count - a.count);

  const mostViewed = rows[0] && rows[0].count > 0 ? rows[0] : null;
  const totalViewsAllTime = views.length;
  const totalViewsPeriod = viewsInPeriod.length;

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("title")}
      </h1>

      <StatsFilters
        mode={mode}
        year={year}
        month={month}
        especeId={especeId}
        animalId={animalId}
        availableYears={availableYears}
        monthNames={monthNames}
        especes={especesDisponibles}
        animals={animauxDeLEspece.map((a) => ({ id: a.id, nom: a.nom }))}
        annualLabel={t("filterAnnual")}
        monthlyLabel={t("filterMonthly")}
        allSpeciesLabel={t("filterAllSpecies")}
        allAnimalsLabel={t("filterAllAnimals")}
      />
      <p className="mt-2 text-xs text-foreground">{t("filterHint")}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-4">
          <Eye className="h-5 w-5 text-foreground" />
          <p className="mt-3 text-2xl font-semibold text-foreground">{totalViewsAllTime}</p>
          <p className="text-xs text-foreground">{t("statTotalViews")}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <CalendarRange className="h-5 w-5 text-foreground" />
          <p className="mt-3 text-2xl font-semibold text-foreground">{totalViewsPeriod}</p>
          <p className="text-xs text-foreground">{t("statPeriodViews")}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4">
          <Trophy className="h-5 w-5 text-foreground" />
          <p className="mt-3 truncate text-2xl font-semibold text-foreground">
            {mostViewed ? mostViewed.animal.nom : "-"}
          </p>
          <p className="text-xs text-foreground">
            {mostViewed
              ? `${t("statMostViewed")} (${mostViewed.count})`
              : t("statMostViewedEmpty")}
          </p>
        </div>
      </div>

      <h2 className="mt-8 font-heading text-lg font-medium text-foreground">{t("chartTitle")}</h2>
      <ViewsChart data={chartData} series={chartSeries} />

      <h2 className="mt-8 font-heading text-lg font-medium text-foreground">
        {t("lifecycleChartTitle")}
      </h2>
      <ViewsChart data={lifecycleChartData} series={lifecycleSeries} />

      <h2 className="mt-8 font-heading text-lg font-medium text-foreground">{t("tableTitle")}</h2>
      {animaux.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-foreground">
              <tr className="divide-x divide-border">
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colName")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colSpecies")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colStatus")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colViews")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ animal, especeNom, count }) => (
                <tr key={animal.id} className="divide-x divide-border border-b border-border last:border-b-0">
                  <td className="whitespace-nowrap px-3 py-2">
                    {animal.statut === "disponible" ? (
                      <Link
                        href={`/espace/fiches/${animal.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {animal.nom}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{animal.nom}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-foreground">{especeNom}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_BADGE_CLASS[animal.statut]}`}
                    >
                      {tStatus(animal.statut)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
