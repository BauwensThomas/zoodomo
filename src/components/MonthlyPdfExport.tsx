"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Sexe, StatutAnimal } from "@/types";

export interface ExportRow {
  nom: string;
  especeNom: string;
  race: string | null;
  sexe: Sexe | null;
  sterilise: boolean | null;
  annee_naissance: number | null;
  date_naissance: string | null;
  numero_identification: string | null;
  date_arrivee: string | null;
  origine: string | null;
  prix: number | null;
  statut: StatutAnimal;
  vues: number;
  created_at: string;
  updated_at: string;
  date_reservation: string | null;
  date_adoption: string | null;
  visState: "days" | "lastDay" | "expired" | null;
  visDays?: number;
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

// Colonne de date propre au statut, en plus de Créée le/Modifiée le (toujours affichées) :
// aucune pour "disponible" (déjà couvert par Créée le), Réservée le / Adoptée le sinon.
const EXTRA_DATE_COLUMN: Record<StatutAnimal, { labelKey: string; field: "date_reservation" | "date_adoption" } | null> = {
  disponible: null,
  reserve: { labelKey: "colReservedDate", field: "date_reservation" },
  adopte: { labelKey: "colAdoptedDate", field: "date_adoption" },
};

// Marge laissée en haut de chaque page pour permettre une perforation (classeur/farde)
// sans toucher le logo ou le contenu.
const TOP_MARGIN = 25;

function firstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Dimensions intrinsèques de public/brand/zoodomo-wordmark.png (voir ZoodomoLogo.tsx).
const LOGO_ASPECT_RATIO = 110 / 480;

async function loadImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
  const tForm = useTranslations("admin.form");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-GB" : locale;

  const notApplicable = tDashboard("notApplicable");
  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(dateLocale) : notApplicable;
  const formatBirth = (r: ExportRow) =>
    r.date_naissance ? formatDate(r.date_naissance) : r.annee_naissance ? String(r.annee_naissance) : notApplicable;
  const formatSexe = (sexe: Sexe | null) =>
    sexe === "male" ? tForm("male") : sexe === "femelle" ? tForm("female") : notApplicable;
  const formatSterilise = (sterilise: boolean | null) =>
    sterilise === true ? tForm("yes") : sterilise === false ? tForm("no") : notApplicable;
  const formatPrix = (prix: number | null) => (prix !== null ? `${prix} €` : notApplicable);
  const formatVisible = (r: ExportRow) =>
    r.visState === "days"
      ? tDashboard("visibleDaysValue", { days: r.visDays! })
      : r.visState === "lastDay"
        ? tDashboard("visibleLastDayValue")
        : r.visState === "expired"
          ? tDashboard("visibleExpiredValue")
          : notApplicable;

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

  async function downloadPdf() {
    if (list.length === 0) return;

    const startLabel = new Date(startDate).toLocaleDateString(dateLocale);
    const endLabel = new Date(endDate).toLocaleDateString(dateLocale);
    const extraDateColumn = EXTRA_DATE_COLUMN[statut];
    const showVisibleDays = statut === "adopte";

    const doc = new jsPDF({ orientation: "landscape" });

    try {
      const logoDataUrl = await loadImageAsDataUrl("/brand/zoodomo-wordmark.png");
      const logoWidth = 32;
      const logoHeight = logoWidth * LOGO_ASPECT_RATIO;
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage(logoDataUrl, "PNG", pageWidth - logoWidth - 14, TOP_MARGIN, logoWidth, logoHeight);
    } catch {
      // Logo décoratif : si le fichier n'a pas pu être chargé, le PDF reste utilisable sans lui.
    }

    doc.setFontSize(14);
    doc.text(`${accountName} - ${label} - ${startLabel} / ${endLabel}`, 14, TOP_MARGIN + 6);

    autoTable(doc, {
      startY: TOP_MARGIN + 12,
      styles: { fontSize: 8 },
      head: [[
        tDashboard("colName"),
        tDashboard("colSpecies"),
        tDashboard("colRace"),
        tDashboard("colSex"),
        tDashboard("colNeutered"),
        tDashboard("colBirth"),
        tDashboard("colIdNumber"),
        tDashboard("colArrival"),
        tDashboard("colOrigin"),
        tDashboard("colPrice"),
        tDashboard("colViews"),
        tDashboard("colCreated"),
        tDashboard("colUpdatedAt"),
        ...(extraDateColumn ? [tDashboard(extraDateColumn.labelKey)] : []),
        ...(showVisibleDays ? [tDashboard("colVisibleDays")] : []),
      ]],
      body: list.map((r) => [
        r.nom,
        r.especeNom,
        r.race || notApplicable,
        formatSexe(r.sexe),
        formatSterilise(r.sterilise),
        formatBirth(r),
        r.numero_identification || notApplicable,
        formatDate(r.date_arrivee),
        r.origine || notApplicable,
        formatPrix(r.prix),
        String(r.vues),
        formatDate(r.created_at),
        formatDate(r.updated_at),
        ...(extraDateColumn ? [formatDate(r[extraDateColumn.field])] : []),
        ...(showVisibleDays ? [formatVisible(r)] : []),
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
        className="rounded-lg border border-foreground bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-foreground"
      />
      <span className="text-xs text-foreground">-</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        aria-label={t("exportEndDateLabel")}
        min={startDate}
        className="rounded-lg border border-foreground bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-foreground"
      />
      <button
        type="button"
        disabled={list.length === 0}
        onClick={downloadPdf}
        title={list.length === 0 ? t("exportEmptyTooltip", { label }) : undefined}
        className="inline-flex items-center gap-1.5 rounded-full border border-foreground bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors enabled:cursor-pointer enabled:hover:bg-muted disabled:opacity-40"
      >
        <Download className="h-3.5 w-3.5" />
        PDF ({list.length})
      </button>
    </div>
  );
}
