"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Cake,
  CalendarDays,
  Dna,
  Fingerprint,
  Home,
  Mail,
  MapPin,
  Mars,
  Phone,
  Tag,
  Venus,
  type LucideIcon,
} from "lucide-react";
import { getSexeLabelKey, pickLocalized } from "@/lib/mock";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import type { Locale } from "@/types";
import type { PreviewContent, PreviewSettings } from "./types";

// La fiche animal garde toujours une mise en page fixe (pas de disposition à choisir,
// conforme au brief) : `settings` n'influence ici que les couleurs/la police, déjà
// appliquées via les variables CSS posées par `PreviewFrame`, donc pas utilisé directement.
export function AnimalPreviewContent({
  content,
}: {
  content: PreviewContent;
  settings: PreviewSettings;
}) {
  const { sampleEspece, sampleAnimaux, photosByAnimal, badgesByAnimal, sampleContact } = content;
  const animal = sampleAnimaux[0];
  const t = useTranslations("animal");
  const tStatus = useTranslations("status");
  const tGallery = useTranslations("gallery");
  const locale = useLocale() as Locale;

  if (!animal || !sampleEspece) {
    return (
      <div className="flex min-h-40 items-center justify-center bg-background p-10 text-center text-sm text-foreground font-body">
        {tGallery("empty")}
      </div>
    );
  }

  const photos = photosByAnimal[animal.id] ?? [];
  const badges = badgesByAnimal[animal.id] ?? [];
  const description = pickLocalized(animal.description, locale, ["fr", "nl", "en"]);
  const foyerIdeal = pickLocalized(animal.foyer_ideal, locale, ["fr", "nl", "en"]);

  const statutOverlay =
    animal.statut === "reserve"
      ? { label: tStatus("reserve"), colorClass: "bg-amber-500" }
      : animal.statut === "adopte"
        ? { label: tStatus("adopte"), colorClass: "bg-rose-500" }
        : null;

  const infos: { label: string; value: string; icon: LucideIcon }[] = [];
  if (animal.race) infos.push({ label: t("race"), value: animal.race, icon: Dna });
  const sexeKey = getSexeLabelKey(animal);
  if (sexeKey)
    infos.push({ label: t("sexe"), value: t(sexeKey), icon: animal.sexe === "male" ? Mars : Venus });
  if (animal.date_naissance)
    infos.push({
      label: t("birthDate"),
      value: new Date(animal.date_naissance).toLocaleDateString(locale === "en" ? "en-GB" : locale),
      icon: Cake,
    });
  else if (animal.annee_naissance)
    infos.push({ label: t("birthYear"), value: String(animal.annee_naissance), icon: Cake });
  if (animal.numero_identification)
    infos.push({ label: t("idNumber"), value: animal.numero_identification, icon: Fingerprint });
  if (animal.date_arrivee)
    infos.push({
      label: t("arrivalDate"),
      value: new Date(animal.date_arrivee).toLocaleDateString(locale === "en" ? "en-GB" : locale),
      icon: CalendarDays,
    });
  if (animal.origine) infos.push({ label: t("origin"), value: animal.origine, icon: MapPin });
  if (animal.prix !== null) infos.push({ label: t("price"), value: `${animal.prix} €`, icon: Tag });

  let contactLabel = t("contact");
  let ContactIcon: LucideIcon = Mail;
  if (sampleContact?.telephone) {
    contactLabel = t("contactWithPhone", { phone: sampleContact.telephone });
    ContactIcon = Phone;
  }

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t("backToGallery")}
          </span>
        </div>

        {/* Même cadre couleur de marque que la vraie fiche animal (`[compte]/[espece]/[slug]/page.tsx`),
            demande utilisateur du 2026-08-27. */}
        <div className="mt-6 rounded-2xl border-2 border-(--account-primary) p-6">
        <div className="grid gap-10 @min-[640px]:grid-cols-2">
          <PhotoCarousel
            photos={photos}
            alt={animal.nom}
            badges={badges}
            noPhotoLabel={t("noPhoto")}
            statutOverlay={statutOverlay}
          />

          <div>
            <div className="flex items-center justify-between gap-3">
              <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
                {animal.nom}
              </h1>
              <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                {tStatus(animal.statut)}
              </span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
              {infos.map((info) => (
                <div key={info.label} className="flex items-start gap-2.5">
                  <info.icon className="mt-0.5 h-4 w-4 shrink-0 text-(--account-primary)" />
                  <div>
                    <dt className="text-xs text-foreground">{info.label}</dt>
                    <dd className="font-medium text-foreground">{info.value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <span className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-(--account-primary) px-6 py-3 text-sm font-semibold text-white shadow-sm">
              <ContactIcon className="h-4 w-4" />
              {contactLabel}
            </span>
          </div>
        </div>

        {description && (
          <section className="mt-12 max-w-3xl">
            <h2 className="font-heading text-xl font-medium text-foreground">
              {t("about", { name: animal.nom })}
            </h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground">{description}</p>
          </section>
        )}

        {foyerIdeal && (
          <section className="mt-8 max-w-3xl">
            <h2 className="font-heading text-xl font-medium text-foreground">{t("idealHome")}</h2>
            <ul className="mt-3 space-y-2">
              {foyerIdeal.split("\n").map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-foreground">
                  <Home className="mt-0.5 h-4 w-4 shrink-0 text-(--account-primary)" />
                  {line}
                </li>
              ))}
            </ul>
          </section>
        )}
        </div>
      </div>
    </div>
  );
}
