"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

interface PhotoCarouselProps {
  photos: { id: string; url: string }[];
  alt: string;
  badges?: { id: string; label: string }[];
  noPhotoLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  photoLabel?: (index: number) => string;
  statutOverlay?: { label: string; colorClass: string } | null;
}

export function PhotoCarousel({
  photos,
  alt,
  badges,
  noPhotoLabel = "Pas de photo",
  previousLabel = "Photo précédente",
  nextLabel = "Photo suivante",
  photoLabel = (index) => `Photo ${index + 1}`,
  statutOverlay,
}: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="relative flex aspect-4/3 flex-col items-center justify-center gap-2 rounded-2xl bg-muted text-sm text-foreground">
        <ImageOff className="h-8 w-8" />
        {noPhotoLabel}
        {statutOverlay && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black/10">
            <span
              className={`-rotate-6 px-10 py-3 text-center text-3xl font-bold uppercase tracking-wide text-white shadow-lg sm:text-4xl ${statutOverlay.colorClass}`}
            >
              {statutOverlay.label}
            </span>
          </div>
        )}
      </div>
    );
  }

  const goTo = (i: number) => setIndex((i + photos.length) % photos.length);

  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted shadow-sm">
      <Image
        src={photos[index].url}
        alt={alt}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover"
        priority
        unoptimized={photos[index].url.startsWith("data:")}
      />

      {badges && badges.length > 0 && (
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span
              key={badge.id}
              className="rounded-full bg-(--account-primary) px-3 py-1 text-xs font-semibold text-white shadow-sm"
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {statutOverlay && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
          <span
            className={`-rotate-6 rounded-md px-6 py-2 text-xl font-bold uppercase tracking-wide text-white shadow-lg ${statutOverlay.colorClass}`}
          >
            {statutOverlay.label}
          </span>
        </div>
      )}

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label={previousLabel}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition-colors hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label={nextLabel}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition-colors hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                aria-label={photoLabel(i)}
                onClick={() => goTo(i)}
                className={`h-1.5 cursor-pointer rounded-full transition-all ${
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
