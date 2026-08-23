"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { cropImageToBlob, type CroppedAreaPixels } from "@/lib/imageCrop";

export type PhotoCategory = "account" | "animals" | "logo";

const ASPECT: Record<PhotoCategory, number> = {
  animals: 4 / 3,
  account: 1,
  logo: 1,
};

/** Taille de sortie du recadrage (bien au-dessus de la taille réellement affichée sur les
 * pages publiques, pour rester net sans viser une résolution irréaliste pour une photo de
 * tous les jours). */
const OUTPUT_SIZE: Record<PhotoCategory, { width: number; height: number }> = {
  animals: { width: 1600, height: 1200 },
  account: { width: 1200, height: 1200 },
  logo: { width: 600, height: 600 },
};

/**
 * Panneau glissant depuis la gauche (même mécanique que le panneau de visualisation de
 * `PersonnalisationForm.tsx`, glissement à droite) : montre la photo sélectionnée dans le
 * cadre final (ratio par catégorie), permet de zoomer et de la déplacer pour bien la cadrer.
 * Pas de contrôle de résolution minimale : écarté après test réel (2026-08-23), une photo
 * courante d'un pro reste souvent en dessous d'un seuil "professionnel" strict tout en
 * paraissant parfaitement nette une fois affichée sur le site ; le contour rouge se
 * déclenchait donc trop souvent sur des photos correctes. Voir `docs/DECISIONS.md`.
 */
export function PhotoCropPanel({
  imageSrc,
  category,
  open,
  onConfirm,
  onCancel,
  title,
  zoomLabel,
  confirmLabel,
  cancelLabel,
}: {
  imageSrc: string | null;
  category: PhotoCategory;
  open: boolean;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
  title: string;
  zoomLabel: string;
  confirmLabel: string;
  cancelLabel: string;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [confirming, setConfirming] = useState(false);

  const aspect = ASPECT[category];
  const outputSize = OUTPUT_SIZE[category];

  const onCropComplete = useCallback((_area: unknown, pixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function resetState() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels) return;
    setConfirming(true);
    try {
      const blob = await cropImageToBlob(
        imageSrc,
        croppedAreaPixels,
        outputSize.width,
        outputSize.height
      );
      onConfirm(blob);
    } finally {
      setConfirming(false);
      resetState();
    }
  }

  function handleCancel() {
    resetState();
    onCancel();
  }

  return (
    <div
      className="fixed inset-y-0 left-0 z-40 w-full overflow-y-auto border-r border-foreground bg-card p-4 shadow-2xl transition-transform duration-300 ease-in-out"
      style={{
        maxWidth: 480,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <p className="font-heading text-lg font-medium text-foreground">{title}</p>

      <div className="relative mt-4 h-80 w-full overflow-hidden rounded-xl border-2 border-border bg-muted">
        {imageSrc && open && (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        )}
      </div>

      <label className="mt-4 block text-sm font-medium text-foreground">
        {zoomLabel}
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="mt-1.5 w-full"
        />
      </label>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 cursor-pointer rounded-full border border-foreground px-4 py-2.5 text-sm font-semibold text-foreground transition-opacity hover:opacity-80"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!croppedAreaPixels || confirming}
          className="flex-1 cursor-pointer rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
