"use client";

import { POLICE_FONT_VARS, isPoliceId } from "@/lib/fonts";
import type { PreviewDevice, PreviewSettings } from "./types";

/**
 * Largeur virtuelle simulée par appareil : sert de base aux media queries de conteneur
 * (`@min-[640px]:...`) utilisées dans les composants d'aperçu à la place de `sm:...`,
 * qui réagirait à la largeur du vrai navigateur plutôt qu'à celle du cadre miniature.
 */
const DEVICE_WIDTHS: Record<PreviewDevice, number> = {
  desktop: 1100,
  tablette: 768,
  telephone: 390,
};

const DISPLAY_WIDTH = 380;
const DISPLAY_HEIGHT = 620;

export function PreviewFrame({
  device,
  settings,
  children,
}: {
  device: PreviewDevice;
  settings: PreviewSettings;
  children: React.ReactNode;
}) {
  const virtualWidth = DEVICE_WIDTHS[device];
  const scale = DISPLAY_WIDTH / virtualWidth;
  const policeId = isPoliceId(settings.police) ? settings.police : "default";
  const fonts = POLICE_FONT_VARS[policeId];

  return (
    <div
      className="mx-auto overflow-x-hidden overflow-y-auto rounded-2xl border border-border bg-white shadow-sm"
      style={{ width: DISPLAY_WIDTH, maxHeight: DISPLAY_HEIGHT }}
    >
      {/*
        `zoom` plutôt que `transform: scale()` : contrairement à `transform`, `zoom`
        modifie réellement la mise en page (pas seulement le rendu visuel), donc la
        hauteur de défilement du cadre correspond à ce qui est visuellement affiché. Avec
        `transform: scale()`, le cadre laissait défiler bien au-delà du contenu réellement
        visible (jusqu'à sa hauteur non réduite), sur du vide.
      */}
      <div
        className="@container select-none font-body"
        style={
          {
            width: virtualWidth,
            zoom: scale,
            "--account-primary": settings.primary,
            "--account-secondary": settings.secondary,
            "--font-heading": fonts.heading,
            "--font-body": fonts.body,
          } as React.CSSProperties
        }
      >
        <div className="pointer-events-none">{children}</div>
      </div>
    </div>
  );
}

export { DEVICE_WIDTHS, DISPLAY_WIDTH, DISPLAY_HEIGHT };
