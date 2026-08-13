"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, ArrowUpDown, CircleCheck, Clock, HeartHandshake, Pencil, Trash2 } from "lucide-react";
import type { StatutAnimal } from "@/types";

export interface FicheRow {
  id: string;
  nom: string;
  especeNom: string;
  vues: number;
  statut: StatutAnimal;
  created_at: string;
  date_reservation: string | null;
  date_adoption: string | null;
  visState: "days" | "lastDay" | "expired" | null;
  visDays?: number;
  deleteAction: (formData: FormData) => void | Promise<void>;
  setDisponibleAction: (formData: FormData) => void | Promise<void>;
  setReserveAction: (formData: FormData) => void | Promise<void>;
  setAdopteAction: (formData: FormData) => void | Promise<void>;
}

type DateColumn = {
  labelKey: string;
  field: "date_reservation" | "date_adoption";
  showVisibleDays: boolean;
};

type SortKey = "nom" | "especeNom" | "vues" | "created_at" | "date_reservation" | "date_adoption";

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 text-foreground/30" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3 w-3 text-foreground" />
  ) : (
    <ArrowDown className="h-3 w-3 text-foreground" />
  );
}

function SortableHeader({
  column,
  label,
  sortKey,
  sortDir,
  onToggle,
}: {
  column: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onToggle: (column: SortKey) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(column)}
      className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap font-medium hover:text-foreground"
    >
      {label}
      <SortIcon active={column === sortKey} dir={sortDir} />
    </button>
  );
}

export function FichesTable({
  rows,
  dateColumn,
  dateLocale,
  defaultSortKey,
}: {
  rows: FicheRow[];
  dateColumn: DateColumn | null;
  dateLocale: string;
  defaultSortKey: SortKey;
}) {
  const t = useTranslations("admin.fiches");
  const tDashboard = useTranslations("admin.dashboard");

  const [sortKey, setSortKey] = useState<SortKey>(defaultSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp: number;
      if (sortKey === "vues") {
        cmp = a.vues - b.vues;
      } else {
        cmp = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function formatDate(value: string | null) {
    return value ? new Date(value).toLocaleDateString(dateLocale) : tDashboard("notApplicable");
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          <col className="w-45" />
          <col className="w-27.5" />
          <col className="w-20" />
          <col className="w-27.5" />
          {dateColumn && <col />}
          {dateColumn?.showVisibleDays && <col />}
          <col />
        </colgroup>
        <thead className="border-b border-border bg-muted/40 text-xs text-foreground/50">
          <tr>
            <th className="px-4 py-2.5">
              <SortableHeader
                column="nom"
                label={tDashboard("colName")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="px-4 py-2.5">
              <SortableHeader
                column="especeNom"
                label={tDashboard("colSpecies")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="px-4 py-2.5">
              <SortableHeader
                column="vues"
                label={tDashboard("colViews")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="px-4 py-2.5">
              <SortableHeader
                column="created_at"
                label={tDashboard("colCreated")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            {dateColumn && (
              <>
                <th className="px-4 py-2.5">
                  <SortableHeader
                    column={dateColumn.field}
                    label={tDashboard(dateColumn.labelKey)}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onToggle={toggleSort}
                  />
                </th>
                {dateColumn.showVisibleDays && (
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">
                    {tDashboard("colVisibleDays")}
                  </th>
                )}
              </>
            )}
            <th className="px-4 py-2.5 font-medium text-right">{t("colActions")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className="truncate px-4 py-2.5 font-medium text-foreground">{row.nom}</td>
              <td className="truncate px-4 py-2.5 text-foreground/70">{row.especeNom}</td>
              <td className="px-4 py-2.5 text-foreground/70">{row.vues}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-foreground/70">
                {formatDate(row.created_at)}
              </td>
              {dateColumn && (
                <>
                  <td className="whitespace-nowrap px-4 py-2.5 text-foreground/70">
                    {formatDate(row[dateColumn.field])}
                  </td>
                  {dateColumn.showVisibleDays && (
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium text-foreground">
                      {row.visState === "days"
                        ? tDashboard("visibleDaysValue", { days: row.visDays! })
                        : row.visState === "lastDay"
                          ? tDashboard("visibleLastDayValue")
                          : row.visState === "expired"
                            ? tDashboard("visibleExpiredValue")
                            : tDashboard("notApplicable")}
                    </td>
                  )}
                </>
              )}
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/espace/fiches/${row.id}`}
                    aria-label={t("editAria", { name: row.nom })}
                    title={t("editTooltip")}
                    className="text-foreground/50 transition-colors hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  {row.statut !== "disponible" && (
                    <form action={row.setDisponibleAction}>
                      <button
                        type="submit"
                        aria-label={t("markAvailableAria", { name: row.nom })}
                        title={t("markAvailableTooltip")}
                        className="cursor-pointer text-foreground/50 transition-colors hover:text-emerald-600"
                      >
                        <CircleCheck className="h-4 w-4" />
                      </button>
                    </form>
                  )}
                  {row.statut !== "reserve" && (
                    <form action={row.setReserveAction}>
                      <button
                        type="submit"
                        aria-label={t("markReservedAria", { name: row.nom })}
                        title={t("markReservedTooltip")}
                        className="cursor-pointer text-foreground/50 transition-colors hover:text-amber-600"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                    </form>
                  )}
                  {row.statut !== "adopte" && (
                    <form action={row.setAdopteAction}>
                      <button
                        type="submit"
                        aria-label={t("markAdoptedAria", { name: row.nom })}
                        title={t("markAdoptedTooltip")}
                        className="cursor-pointer text-foreground/50 transition-colors hover:text-rose-600"
                      >
                        <HeartHandshake className="h-4 w-4" />
                      </button>
                    </form>
                  )}
                  <form action={row.deleteAction}>
                    <button
                      type="submit"
                      aria-label={t("deleteAria", { name: row.nom })}
                      title={t("deleteTooltip")}
                      className="cursor-pointer text-foreground/50 transition-colors hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
