"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { PhotoCropPanel, type PhotoCategory } from "@/components/PhotoCropPanel";

interface Photo {
  url: string;
  uploading: boolean;
  /** Aperçu local (`URL.createObjectURL`) à révoquer une fois remplacé par la vraie URL,
   * pour ne pas garder ces objets en mémoire indéfiniment. */
  objectUrl?: string;
}

/** Le HEIC/HEIF (format par défaut des photos iPhone) n'est décodable nativement que par
 * Safari : sur Windows, ce type de fichier a souvent un `File.type` vide (pas d'association
 * MIME enregistrée), d'où la vérification par extension en complément. */
function isHeicFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

/** Convertit un fichier HEIC/HEIF en JPEG avant de l'envoyer au panneau de recadrage
 * (`react-easy-crop`/canvas ne savent pas décoder ce format). Import dynamique : bibliothèque
 * WASM assez lourde, à ne charger que si un fichier HEIC est réellement rencontré. */
async function convertHeicIfNeeded(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([blob], newName, { type: "image/jpeg" });
}

export function PhotoUploadField({
  name,
  accountId,
  category,
  defaultPhotos = [],
  maxPhotos = 5,
  dropLabel,
  maxReachedLabel,
  removeLabel,
  uploadErrorLabel,
}: {
  name: string;
  /** Premier segment du chemin Storage (`{accountId}/{category}/{uuid}.jpg`), doit
   * correspondre au compte connecté (policy RLS `photos_insert_own`, voir
   * `supabase/migrations/0009_photos_storage_bucket.sql`). */
  accountId: string;
  category: PhotoCategory;
  defaultPhotos?: string[];
  maxPhotos?: number;
  dropLabel: string;
  maxReachedLabel: string;
  removeLabel: string;
  uploadErrorLabel: string;
}) {
  const t = useTranslations("admin.form");
  const [photos, setPhotos] = useState<Photo[]>(
    defaultPhotos.map((url) => ({ url, uploading: false }))
  );
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(false);
  const [convertingHeic, setConvertingHeic] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // File d'attente de recadrage : chaque photo sélectionnée passe par `PhotoCropPanel` avant
  // l'upload, une à la fois (`cropTarget` = photo actuellement dans le panneau, `queue` = les
  // suivantes en attente), demande utilisateur explicite (qualité professionnelle du cadrage).
  const [queue, setQueue] = useState<File[]>([]);
  const [cropTarget, setCropTarget] = useState<{ file: File; src: string } | null>(null);

  function openNext(files: File[]) {
    const [next, ...rest] = files;
    if (!next) {
      setCropTarget(null);
      setQueue([]);
      return;
    }
    setCropTarget({ file: next, src: URL.createObjectURL(next) });
    setQueue(rest);
  }

  async function addFiles(fileList: FileList | File[]) {
    const remaining = maxPhotos - photos.length - queue.length - (cropTarget ? 1 : 0);
    if (remaining <= 0) return;
    const rawFiles = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/") || isHeicFile(f))
      .slice(0, remaining);
    if (rawFiles.length === 0) return;

    setConvertingHeic(rawFiles.some(isHeicFile));
    const files: File[] = [];
    for (const file of rawFiles) {
      try {
        files.push(await convertHeicIfNeeded(file));
      } catch {
        setError(true);
      }
    }
    setConvertingHeic(false);
    if (files.length === 0) return;

    if (cropTarget) {
      setQueue((prev) => [...prev, ...files]);
    } else {
      openNext(files);
    }
  }

  async function handleCropConfirm(blob: Blob) {
    if (!cropTarget) return;
    URL.revokeObjectURL(cropTarget.src);
    const objectUrl = URL.createObjectURL(blob);
    const placeholder: Photo = { url: objectUrl, uploading: true, objectUrl };
    setPhotos((prev) => [...prev, placeholder]);
    openNext(queue);

    try {
      const path = `${accountId}/${category}/${crypto.randomUUID()}.jpg`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(path);
      setPhotos((prev) =>
        prev.map((p) => (p === placeholder ? { url: publicUrl, uploading: false } : p))
      );
    } catch {
      setError(true);
      setPhotos((prev) => prev.filter((p) => p !== placeholder));
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function handleCropCancel() {
    if (cropTarget) URL.revokeObjectURL(cropTarget.src);
    openNext(queue);
  }

  function removePhoto(target: Photo) {
    if (target.objectUrl) URL.revokeObjectURL(target.objectUrl);
    setPhotos((prev) => prev.filter((p) => p !== target));
  }

  // Un upload encore en cours n'est jamais soumis : si le formulaire est enregistré pendant
  // qu'une photo est encore en train d'uploader, cette photo est simplement absente de cet
  // enregistrement (pas de data locale/temporaire envoyée par erreur).
  const submittedValue = photos
    .filter((p) => !p.uploading)
    .map((p) => p.url)
    .join("\n");

  return (
    <div>
      <input type="hidden" name={name} value={submittedValue} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {photos.length < maxPhotos ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) void addFiles(e.dataTransfer.files);
          }}
          className={`mt-1.5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm transition-colors ${
            isDragging
              ? "border-foreground bg-muted text-foreground"
              : "border-border text-foreground hover:border-foreground/40"
          }`}
        >
          <ImagePlus className="h-6 w-6" />
          <span>
            {dropLabel} ({photos.length}/{maxPhotos})
          </span>
        </div>
      ) : (
        <p className="mt-1.5 text-sm text-foreground">{maxReachedLabel}</p>
      )}

      {convertingHeic && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("heicConverting")}
        </p>
      )}

      {error && <p className="mt-1.5 text-sm text-red-600">{uploadErrorLabel}</p>}

      {photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removePhoto(photo)}
                aria-label={removeLabel}
                className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <PhotoCropPanel
        imageSrc={cropTarget?.src ?? null}
        category={category}
        open={cropTarget !== null}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
        title={t("cropTitle")}
        zoomLabel={t("cropZoomLabel")}
        confirmLabel={t("cropConfirm")}
        cancelLabel={t("cropCancel")}
      />
    </div>
  );
}
