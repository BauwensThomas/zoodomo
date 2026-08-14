"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { PdfExportButton, type ExportRow } from "@/components/MonthlyPdfExport";
import { FichesTable, type FicheRow } from "@/components/FichesTable";
import type { StatutAnimal } from "@/types";

type DateColumn = {
  labelKey: string;
  field: "date_reservation" | "date_adoption";
  showVisibleDays: boolean;
};

export interface FichesSectionConfig {
  statut: StatutAnimal;
  title: string;
  dateColumn: DateColumn | null;
  defaultSortKey: "created_at" | "date_reservation" | "date_adoption";
}

export function FichesSections({
  rows,
  exportRows,
  sections,
  dateLocale,
  accountName,
}: {
  rows: FicheRow[];
  exportRows: ExportRow[];
  sections: FichesSectionConfig[];
  dateLocale: string;
  accountName: string;
}) {
  const t = useTranslations("admin.fiches");
  const [search, setSearch] = useState("");

  return (
    <div>
      <div className="relative mt-6 w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="w-full rounded-full border border-border bg-white py-2 pl-9 pr-4 text-sm text-foreground outline-none focus:border-foreground"
        />
      </div>

      {sections.map(({ statut, title, dateColumn, defaultSortKey }) => {
        const list = rows.filter((r) => r.statut === statut);
        if (list.length === 0) return null;
        return (
          <section key={statut} className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-lg font-medium text-foreground">
                {title} ({list.length})
              </h2>
              <PdfExportButton statut={statut} rows={exportRows} accountName={accountName} />
            </div>
            <FichesTable
              rows={list}
              dateColumn={dateColumn}
              dateLocale={dateLocale}
              defaultSortKey={defaultSortKey}
              search={search}
            />
          </section>
        );
      })}
    </div>
  );
}
