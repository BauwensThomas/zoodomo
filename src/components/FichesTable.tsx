"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CircleCheck,
  Clock,
  ExternalLink,
  HeartHandshake,
  Pencil,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Sexe, StatutAnimal } from "@/types";

export interface FicheRow {
  id: string;
  nom: string;
  especeNom: string;
  publicUrl: string | null;
  race: string | null;
  sexe: Sexe | null;
  sterilise: boolean | null;
  annee_naissance: number | null;
  date_naissance: string | null;
  numero_identification: string | null;
  date_arrivee: string | null;
  origine: string | null;
  prix: number | null;
  vues: number;
  statut: StatutAnimal;
  created_at: string;
  updated_at: string;
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

type SortKey =
  | "nom"
  | "especeNom"
  | "race"
  | "sexe"
  | "sterilise"
  | "birth"
  | "numero_identification"
  | "date_arrivee"
  | "origine"
  | "prix"
  | "vues"
  | "created_at"
  | "updated_at"
  | "date_reservation"
  | "date_adoption";

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 text-foreground" />;
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
  search = "",
}: {
  rows: FicheRow[];
  dateColumn: DateColumn | null;
  dateLocale: string;
  defaultSortKey: SortKey;
  search?: string;
}) {
  const t = useTranslations("admin.fiches");
  const tDashboard = useTranslations("admin.dashboard");
  const tForm = useTranslations("admin.form");

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

  function formatDate(value: string | null) {
    return value ? new Date(value).toLocaleDateString(dateLocale) : tDashboard("notApplicable");
  }

  function formatBirth(row: FicheRow) {
    if (row.date_naissance) return formatDate(row.date_naissance);
    if (row.annee_naissance) return String(row.annee_naissance);
    return tDashboard("notApplicable");
  }

  function formatSexe(sexe: Sexe | null) {
    if (sexe === "male") return tForm("male");
    if (sexe === "femelle") return tForm("female");
    return tDashboard("notApplicable");
  }

  function formatSterilise(sterilise: boolean | null) {
    if (sterilise === true) return tForm("yes");
    if (sterilise === false) return tForm("no");
    return tDashboard("notApplicable");
  }

  function formatPrix(prix: number | null) {
    return prix !== null ? `${prix} €` : tDashboard("notApplicable");
  }

  const [pending, setPending] = useState<{
    message: string;
    danger?: boolean;
    run: () => void;
  } | null>(null);

  function askConfirm(message: string, run: () => void, danger?: boolean) {
    setPending({ message, run, danger });
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => {
      const haystack = [
        row.nom,
        row.especeNom,
        row.race,
        formatSexe(row.sexe),
        formatSterilise(row.sterilise),
        formatBirth(row),
        row.numero_identification,
        formatDate(row.date_arrivee),
        row.origine,
        formatPrix(row.prix),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search]);

  const sorted = useMemo(() => {
    function sortValue(row: FicheRow, key: SortKey): number | string {
      switch (key) {
        case "vues":
          return row.vues;
        case "prix":
          return row.prix ?? -Infinity;
        case "sterilise":
          return row.sterilise === true ? 1 : row.sterilise === false ? 0 : -1;
        case "birth":
          return row.date_naissance
            ? new Date(row.date_naissance).getTime()
            : row.annee_naissance
              ? Date.UTC(row.annee_naissance, 0, 1)
              : -Infinity;
        case "sexe":
        case "race":
        case "numero_identification":
        case "date_arrivee":
        case "origine":
          return row[key] ?? "";
        default:
          return String(row[key] ?? "");
      }
    }
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      const cmp =
        typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="mt-3">
      <div className="overflow-x-auto rounded-2xl border border-foreground bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs text-foreground">
          <tr className="divide-x divide-border">
            <th className="w-8 px-2 py-2" aria-hidden="true" />
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="nom"
                label={tDashboard("colName")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="especeNom"
                label={tDashboard("colSpecies")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="race"
                label={tDashboard("colRace")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="sexe"
                label={tDashboard("colSex")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="sterilise"
                label={tDashboard("colNeutered")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="birth"
                label={tDashboard("colBirth")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="numero_identification"
                label={tDashboard("colIdNumber")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="date_arrivee"
                label={tDashboard("colArrival")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="origine"
                label={tDashboard("colOrigin")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="prix"
                label={tDashboard("colPrice")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="vues"
                label={tDashboard("colViews")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="created_at"
                label={tDashboard("colCreated")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            <th className="whitespace-nowrap px-3 py-2">
              <SortableHeader
                column="updated_at"
                label={tDashboard("colUpdatedAt")}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggle={toggleSort}
              />
            </th>
            {dateColumn && (
              <>
                <th className="whitespace-nowrap px-3 py-2">
                  <SortableHeader
                    column={dateColumn.field}
                    label={tDashboard(dateColumn.labelKey)}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onToggle={toggleSort}
                  />
                </th>
                {dateColumn.showVisibleDays && (
                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    {tDashboard("colVisibleDays")}
                  </th>
                )}
              </>
            )}
            <th className="whitespace-nowrap px-3 py-2 font-medium text-right">
              {t("colActions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="divide-x divide-border border-b border-border last:border-b-0">
              <td className="whitespace-nowrap px-2 py-2 text-center">
                {row.publicUrl && (
                  <a
                    href={row.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("viewPublicAria", { name: row.nom })}
                    title={t("viewPublicTooltip")}
                    className="inline-flex text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">
                {row.nom}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">{row.especeNom}</td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">
                {row.race || tDashboard("notApplicable")}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">
                {formatSexe(row.sexe)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">
                {formatSterilise(row.sterilise)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">
                {formatBirth(row)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">
                {row.numero_identification || tDashboard("notApplicable")}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">
                {formatDate(row.date_arrivee)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">
                {row.origine || tDashboard("notApplicable")}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">
                {formatPrix(row.prix)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">{row.vues}</td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">
                {formatDate(row.created_at)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-foreground">
                {formatDate(row.updated_at)}
              </td>
              {dateColumn && (
                <>
                  <td className="whitespace-nowrap px-3 py-2 text-foreground">
                    {formatDate(row[dateColumn.field])}
                  </td>
                  {dateColumn.showVisibleDays && (
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">
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
              <td className="whitespace-nowrap px-3 py-2">
                <div className="flex items-center justify-end gap-3">
                  {row.statut === "disponible" && (
                    <Link
                      href={`/espace/fiches/${row.id}`}
                      aria-label={t("editAria", { name: row.nom })}
                      title={t("editTooltip")}
                      className="text-yellow-500 transition-opacity hover:opacity-70"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  )}
                  {row.statut !== "disponible" && (
                    <button
                      type="button"
                      onClick={() =>
                        askConfirm(t("markAvailableConfirm", { name: row.nom }), () =>
                          row.setDisponibleAction(new FormData())
                        )
                      }
                      aria-label={t("markAvailableAria", { name: row.nom })}
                      title={t("markAvailableTooltip")}
                      className="cursor-pointer text-blue-600 transition-opacity hover:opacity-70"
                    >
                      <CircleCheck className="h-4 w-4" />
                    </button>
                  )}
                  {row.statut !== "reserve" && (
                    <button
                      type="button"
                      onClick={() =>
                        askConfirm(t("markReservedConfirm", { name: row.nom }), () =>
                          row.setReserveAction(new FormData())
                        )
                      }
                      aria-label={t("markReservedAria", { name: row.nom })}
                      title={t("markReservedTooltip")}
                      className="cursor-pointer text-pink-500 transition-opacity hover:opacity-70"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                  )}
                  {row.statut !== "adopte" && (
                    <button
                      type="button"
                      onClick={() =>
                        askConfirm(t("markAdoptedConfirm", { name: row.nom }), () =>
                          row.setAdopteAction(new FormData())
                        )
                      }
                      aria-label={t("markAdoptedAria", { name: row.nom })}
                      title={t("markAdoptedTooltip")}
                      className="cursor-pointer text-green-600 transition-opacity hover:opacity-70"
                    >
                      <HeartHandshake className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      askConfirm(
                        t("deleteConfirm", { name: row.nom }),
                        () => row.deleteAction(new FormData()),
                        true
                      )
                    }
                    aria-label={t("deleteAria", { name: row.nom })}
                    title={t("deleteTooltip")}
                    className="cursor-pointer text-red-600 transition-opacity hover:opacity-70"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="p-6 text-center text-sm text-foreground">
          {t("searchNoResults", { query: search })}
        </p>
      )}
      </div>
      <ConfirmDialog
        open={pending !== null}
        message={pending?.message ?? ""}
        confirmLabel={t("confirmButton")}
        cancelLabel={t("cancelButton")}
        danger={pending?.danger}
        onConfirm={() => {
          pending?.run();
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
