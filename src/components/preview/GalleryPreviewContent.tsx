"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Cake, Mars, Tag, Venus } from "lucide-react";
import { getSexeLabelKey, pickLocalized } from "@/lib/mock";
import type { Animal, Locale } from "@/types";
import type { PreviewContent, PreviewSettings } from "./types";

const STATUT_DOT: Record<string, string> = {
  disponible: "bg-emerald-500",
  reserve: "bg-amber-500",
  adopte: "bg-neutral-400",
};

function AnimalInfoBlock({
  animal,
  statutLabel,
  variant,
  tAnimal,
  locale,
}: {
  animal: Animal;
  statutLabel: string;
  variant: "card" | "row";
  tAnimal: (key: string, values?: Record<string, string | number>) => string;
  locale: Locale;
}) {
  const sexeKey = getSexeLabelKey(animal);
  const age = animal.date_naissance
    ? new Date(animal.date_naissance).toLocaleDateString(locale === "en" ? "en-GB" : locale)
    : animal.annee_naissance
      ? String(animal.annee_naissance)
      : null;
  const description = pickLocalized(animal.description, locale, ["fr", "nl", "en"]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-medium text-foreground">{animal.nom}</h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${STATUT_DOT[animal.statut]}`} />
          {statutLabel}
        </span>
      </div>
      {animal.race && <p className="mt-1 text-sm text-foreground">{animal.race}</p>}

      {/* Sexe/âge affichés dans les 2 dispositions (grille comprise, demande utilisateur du
          2026-08-27, même correctif que la vraie galerie publique, `[compte]/[espece]/page.tsx`) ;
          prix réservé à "row" (pas de place en grille). */}
      {(sexeKey || age || (variant === "row" && animal.prix !== null)) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-foreground">
          {sexeKey && (
            <span className="inline-flex items-center gap-1.5">
              {animal.sexe === "male" ? (
                <Mars className="h-4 w-4 text-(--account-primary)" />
              ) : (
                <Venus className="h-4 w-4 text-(--account-primary)" />
              )}
              {tAnimal(sexeKey)}
            </span>
          )}
          {age && (
            <span className="inline-flex items-center gap-1.5">
              <Cake className="h-4 w-4 text-(--account-primary)" />
              {age}
            </span>
          )}
          {variant === "row" && animal.prix !== null && (
            <span className="inline-flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-(--account-primary)" />
              {animal.prix} €
            </span>
          )}
        </div>
      )}

      {variant === "row" && description && (
        <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-foreground">{description}</p>
      )}
    </div>
  );
}

export function GalleryPreviewContent({
  content,
  settings,
}: {
  content: PreviewContent;
  settings: PreviewSettings;
}) {
  const { sampleEspece, sampleAnimaux, photosByAnimal, badgesByAnimal } = content;
  const t = useTranslations("gallery");
  const tStatus = useTranslations("status");
  const tSpecies = useTranslations("species");
  const tAnimal = useTranslations("animal");
  const locale = useLocale() as Locale;

  const especeNom = sampleEspece
    ? tSpecies.has(sampleEspece.slug)
      ? tSpecies(sampleEspece.slug)
      : sampleEspece.nom
    : "";
  const disposition = settings.dispositionGalerie;

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
            {sampleEspece ? t("availableTitle", { species: especeNom }) : t("empty")}
          </h1>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t("allSpecies")}
          </span>
        </div>

        {sampleAnimaux.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground">
            {t("empty")}
          </p>
        ) : disposition === "empilee" || disposition === "alternee" ? (
          <div className="mt-8 flex flex-col gap-5">
            {sampleAnimaux.map((animal, index) => {
              const photo = photosByAnimal[animal.id]?.[0];
              const badges = badgesByAnimal[animal.id] ?? [];
              const reverse = disposition === "alternee" && index % 2 === 1;
              return (
                <div
                  key={animal.id}
                  className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm @min-[640px]:flex-row ${
                    reverse ? "@min-[640px]:flex-row-reverse" : ""
                  }`}
                >
                  <div className="relative aspect-4/3 bg-muted @min-[640px]:w-64 @min-[640px]:shrink-0">
                    {photo && (
                      <Image
                        src={photo.url}
                        alt={animal.nom}
                        fill
                        unoptimized
                        sizes="256px"
                        loading={index === 0 ? "eager" : "lazy"}
                        className="object-cover"
                      />
                    )}
                    {badges.length > 0 && (
                      <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
                        {badges.map((badge) => (
                          <span
                            key={badge.id}
                            className="rounded-full bg-(--account-primary) px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
                          >
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <AnimalInfoBlock
                      animal={animal}
                      statutLabel={tStatus(animal.statut)}
                      variant="row"
                      tAnimal={tAnimal}
                      locale={locale}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 @min-[640px]:grid-cols-2 @min-[1024px]:grid-cols-3">
            {sampleAnimaux.map((animal, index) => {
              const photo = photosByAnimal[animal.id]?.[0];
              const badges = badgesByAnimal[animal.id] ?? [];
              return (
                <div
                  key={animal.id}
                  className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                >
                  <div className="relative aspect-4/3 bg-muted">
                    {photo && (
                      <Image
                        src={photo.url}
                        alt={animal.nom}
                        fill
                        unoptimized
                        sizes="256px"
                        loading={index === 0 ? "eager" : "lazy"}
                        className="object-cover"
                      />
                    )}
                    {badges.length > 0 && (
                      <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
                        {badges.map((badge) => (
                          <span
                            key={badge.id}
                            className="rounded-full bg-(--account-primary) px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
                          >
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <AnimalInfoBlock
                    animal={animal}
                    statutLabel={tStatus(animal.statut)}
                    variant="card"
                    tAnimal={tAnimal}
                    locale={locale}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
