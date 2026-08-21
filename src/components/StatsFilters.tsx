"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Filtres pilotés par l'URL (`?mode=&year=&month=`) plutôt que par un état client local :
 * la page Statistiques reste un composant serveur qui lit `searchParams` pour calculer les
 * données agrégées, cohérent avec le reste du mock (pas de fetch client-side séparé).
 */
export function StatsFilters({
  mode,
  year,
  month,
  especeId,
  animalId,
  availableYears,
  monthNames,
  especes,
  animals,
  annualLabel,
  monthlyLabel,
  allSpeciesLabel,
  allAnimalsLabel,
}: {
  mode: "annuel" | "mensuel";
  year: number;
  month: number;
  especeId: string;
  animalId: string;
  availableYears: number[];
  monthNames: string[];
  especes: { id: string; nom: string }[];
  animals: { id: string; nom: string }[];
  annualLabel: string;
  monthlyLabel: string;
  allSpeciesLabel: string;
  allAnimalsLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(partial: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(partial)) params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  const selectClass =
    "rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-foreground";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <select
        value={mode}
        onChange={(e) => update({ mode: e.target.value })}
        className={selectClass}
      >
        <option value="annuel">{annualLabel}</option>
        <option value="mensuel">{monthlyLabel}</option>
      </select>
      <select
        value={year}
        onChange={(e) => update({ year: e.target.value })}
        className={selectClass}
      >
        {availableYears.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      {mode === "mensuel" && (
        <select
          value={month}
          onChange={(e) => update({ month: e.target.value })}
          className={selectClass}
        >
          {monthNames.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
      )}
      <select
        value={especeId}
        onChange={(e) => update({ espece: e.target.value, animal: "tous" })}
        className={selectClass}
      >
        <option value="toutes">{allSpeciesLabel}</option>
        {especes.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nom}
          </option>
        ))}
      </select>
      <select
        value={animalId}
        onChange={(e) => update({ animal: e.target.value })}
        className={selectClass}
      >
        <option value="tous">{allAnimalsLabel}</option>
        {animals.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nom}
          </option>
        ))}
      </select>
    </div>
  );
}
