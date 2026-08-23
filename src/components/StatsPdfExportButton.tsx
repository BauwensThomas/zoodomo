"use client";

import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Marge laissée en haut de la page, même valeur que MonthlyPdfExport.tsx (perforation
// classeur/farde sans toucher le logo ou le contenu).
const TOP_MARGIN = 25;

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

export function StatsPdfExportButton({
  accountName,
  periodLabel,
  especeLabel,
  animalLabel,
  totalViewsAllTime,
  totalViewsPeriod,
  totalAdoptedPriceAllTime,
  totalAdoptedPricePeriod,
}: {
  accountName: string;
  periodLabel: string;
  especeLabel: string;
  animalLabel: string;
  totalViewsAllTime: number;
  totalViewsPeriod: number;
  totalAdoptedPriceAllTime: number;
  totalAdoptedPricePeriod: number;
}) {
  const t = useTranslations("admin.stats");

  async function downloadPdf() {
    const doc = new jsPDF();

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
    doc.text(`${accountName} - ${t("title")} - ${periodLabel}`, 14, TOP_MARGIN + 6);
    doc.setFontSize(10);
    doc.text(`${especeLabel} - ${animalLabel}`, 14, TOP_MARGIN + 13);

    autoTable(doc, {
      startY: TOP_MARGIN + 20,
      styles: { fontSize: 10 },
      head: [[t("colIndicator"), t("colValue")]],
      body: [
        [t("statTotalViews"), String(totalViewsAllTime)],
        [t("statPeriodViews"), String(totalViewsPeriod)],
        [t("statAdoptedPriceTotal"), `${totalAdoptedPriceAllTime} €`],
        [t("statAdoptedPricePeriod"), `${totalAdoptedPricePeriod} €`],
      ],
    });

    doc.save(`${accountName}-statistiques-${periodLabel}.pdf`);
  }

  return (
    <button
      type="button"
      onClick={downloadPdf}
      title={t("exportAria")}
      aria-label={t("exportAria")}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-foreground px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
    >
      <Download className="h-3.5 w-3.5" />
      PDF
    </button>
  );
}
