"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

/**
 * Compresse une image côté client (redimensionnement + réencodage JPEG) avant de la
 * transformer en data URL, stockée telle quelle en base (`support_messages.photo_url`).
 * Contrairement à `PhotoUploadField.tsx` (photos de compte/animaux/logo, migrées vers
 * Supabase Storage, voir docs/DECISIONS.md), cette pièce jointe ponctuelle "contacter le
 * webmaster" reste volontairement en data: URL : usage admin-only, pas de photo publique,
 * pas besoin d'un vrai fichier dans un bucket pour un aléa d'assistance technique.
 */
function compressImage(file: File, maxDimension = 1000, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Image decode failed"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

export function LegacyPhotoUploadField({
  name,
  defaultPhotos = [],
  maxPhotos = 5,
  dropLabel,
  maxReachedLabel,
  removeLabel,
}: {
  name: string;
  defaultPhotos?: string[];
  maxPhotos?: number;
  dropLabel: string;
  maxReachedLabel: string;
  removeLabel: string;
}) {
  const [photos, setPhotos] = useState<string[]>(defaultPhotos);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(fileList: FileList | File[]) {
    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) return;
    const files = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);
    const compressed = await Promise.all(files.map((f) => compressImage(f)));
    setPhotos((prev) => [...prev, ...compressed]);
  }

  return (
    <div>
      <input type="hidden" name={name} value={photos.join("\n")} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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

      {photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((url, index) => (
            <div
              key={index}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                aria-label={removeLabel}
                className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
