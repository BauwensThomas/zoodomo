"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { StatutAnimal } from "@/types";

export interface ExportRow {
  nom: string;
  especeNom: string;
  statut: StatutAnimal;
  vues: number;
  created_at: string;
  date_reservation: string | null;
  date_adoption: string | null;
}

const DATE_FIELD: Record<StatutAnimal, "created_at" | "date_reservation" | "date_adoption"> = {
  disponible: "created_at",
  reserve: "date_reservation",
  adopte: "date_adoption",
};

const STAT_KEY: Record<StatutAnimal, string> = {
  disponible: "statAvailable",
  reserve: "statReserved",
  adopte: "statAdopted",
};

const DATE_LABEL_KEY: Record<StatutAnimal, string> = {
  disponible: "colCreated",
  reserve: "colReservedDate",
  adopte: "colAdoptedDate",
};

function firstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function PdfExportButton({
  statut,
  rows,
  accountName,
}: {
  statut: StatutAnimal;
  rows: ExportRow[];
  accountName: string;
}) {
  const t = useTranslations("admin.fiches");
  const tDashboard = useTranslations("admin.dashboard");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-GB" : locale;

  const [startDate, setStartDate] = useState(firstDayOfMonth());
  const [endDate, setEndDate] = useState(today());

  const field = DATE_FIELD[statut];
  const list = rows.filter((r) => {
    if (r.statut !== statut) return false;
    const value = r[field]?.slice(0, 10);
    if (!value) return false;
    return value >= startDate && value <= endDate;
  });
  const label = tDashboard(STAT_KEY[statut]);

  function downloadPdf() {
    if (list.length === 0) return;

    const startLabel = new Date(startDate).toLocaleDateString(dateLocale);
    const endLabel = new Date(endDate).toLocaleDateString(dateLocale);

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${accountName} - ${label} - ${startLabel} / ${endLabel}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [[
        tDashboard("colName"),
        tDashboard("colSpecies"),
        tDashboard("colViews"),
        tDashboard(DATE_LABEL_KEY[statut]),
      ]],
      body: list.map((r) => [
        r.nom,
        r.especeNom,
        String(r.vues),
        r[field] ? new Date(r[field] as string).toLocaleDateString(dateLocale) : "-",
      ]),
    });

    doc.save(`${accountName}-${label}-${startDate}_${endDate}.pdf`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        aria-label={t("exportStartDateLabel")}
        max={endDate}
        className="rounded-lg border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-foreground"
      />
      <span className="text-xs text-foreground/40">-</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        aria-label={t("exportEndDateLabel")}
        min={startDate}
        className="rounded-lg border border-border px-2 py-1 text-xs text-foreground outline-none focus:border-foreground"
      />
      <button
        type="button"
        disabled={list.length === 0}
        onClick={downloadPdf}
        title={list.length === 0 ? t("exportEmptyTooltip", { label }) : undefined}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors enabled:cursor-pointer enabled:hover:bg-muted disabled:opacity-40"
      >
        <Download className="h-3.5 w-3.5" />
        PDF ({list.length})
      </button>
    </div>
  );
}
