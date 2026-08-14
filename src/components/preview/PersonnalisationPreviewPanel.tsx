"use client";

import { useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { PreviewFrame } from "./PreviewFrame";
import { PreviewLayoutChrome } from "./PreviewLayoutChrome";
import { HomePreviewContent } from "./HomePreviewContent";
import { GalleryPreviewContent } from "./GalleryPreviewContent";
import { AnimalPreviewContent } from "./AnimalPreviewContent";
import type { PreviewContent, PreviewDevice, PreviewPage, PreviewSettings } from "./types";

const PAGE_TABS: { id: PreviewPage; label: string }[] = [
  { id: "accueil", label: "Accueil" },
  { id: "categorie", label: "Catégorie" },
  { id: "fiche", label: "Annonce" },
];

const DEVICE_TABS: { id: PreviewDevice; icon: typeof Monitor; label: string }[] = [
  { id: "desktop", icon: Monitor, label: "Ordinateur" },
  { id: "tablette", icon: Tablet, label: "Tablette" },
  { id: "telephone", icon: Smartphone, label: "Téléphone" },
];

export function PersonnalisationPreviewPanel({
  content,
  settings,
}: {
  content: PreviewContent;
  settings: PreviewSettings;
}) {
  const [page, setPage] = useState<PreviewPage>("accueil");
  const [device, setDevice] = useState<PreviewDevice>("desktop");

  return (
    <div className="rounded-3xl border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-1.5 rounded-full bg-muted p-1">
        {PAGE_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setPage(id)}
            className={`flex-1 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              page === id ? "bg-white text-foreground shadow-sm" : "text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {DEVICE_TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setDevice(id)}
            aria-label={label}
            title={label}
            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors ${
              device === id
                ? "bg-foreground text-background"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="mt-3">
        <PreviewFrame device={device} settings={settings}>
          <PreviewLayoutChrome nomAffichage={content.account.nomAffichage}>
            {page === "accueil" && <HomePreviewContent content={content} settings={settings} />}
            {page === "categorie" && <GalleryPreviewContent content={content} settings={settings} />}
            {page === "fiche" && <AnimalPreviewContent content={content} settings={settings} />}
          </PreviewLayoutChrome>
        </PreviewFrame>
      </div>
    </div>
  );
}
