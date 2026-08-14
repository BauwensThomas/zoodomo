"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Building2, ChevronRight, Mail, MapPin, Phone } from "lucide-react";
import { pickLocalized, localesWithContent } from "@/lib/mock";
import { getEspeceIcon } from "@/lib/species-icons";
import type { Locale } from "@/types";
import type { PreviewContent, PreviewSettings } from "./types";

export function HomePreviewContent({
  content,
  settings,
}: {
  content: PreviewContent;
  settings: PreviewSettings;
}) {
  const { account, accountPhotos, especes } = content;
  const t = useTranslations("account");
  const tSpecies = useTranslations("species");
  const tAnimal = useTranslations("animal");
  const tLocales = useTranslations("locales");
  const locale = useLocale() as Locale;

  const listFormatter = new Intl.ListFormat(locale === "en" ? "en" : locale, {
    style: "long",
    type: "conjunction",
  });
  const aPropos = pickLocalized(account.aPropos, locale, account.languesActives);
  const aProposFallbackNote =
    aPropos && !account.aPropos[locale]
      ? tAnimal("textOnlyAvailableIn", {
          languages: listFormatter.format(localesWithContent(account.aPropos).map((l) => tLocales(l))),
        })
      : null;

  const hasPhotos = accountPhotos.length > 0;
  const hasText = !!aPropos;
  const sideBySide =
    (settings.dispositionPresentation === "photo_texte" ||
      settings.dispositionPresentation === "texte_photo") &&
    hasPhotos &&
    hasText;

  const textBlock = (
    <div>
      <p className="whitespace-pre-line text-foreground">{aPropos}</p>
      {aProposFallbackNote && <p className="mt-2 text-sm text-amber-600">{aProposFallbackNote}</p>}
    </div>
  );

  const photosCluster = (
    <div className="flex shrink-0 flex-col items-center gap-3">
      {accountPhotos.map((photo) => (
        <div
          key={photo.id}
          className="relative aspect-square w-72 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm @min-[640px]:w-80"
        >
          <Image src={photo.url} alt={account.nomAffichage} fill unoptimized sizes="320px" className="object-cover" />
        </div>
      ))}
    </div>
  );

  const photosRow = (
    <div className={`mt-4 flex flex-wrap gap-3 ${accountPhotos.length < 3 ? "justify-center" : ""}`}>
      {accountPhotos.map((photo) => (
        <div
          key={photo.id}
          className="relative aspect-square w-[calc((100%-0.75rem)/2)] shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm @min-[640px]:w-[calc((100%-1.5rem)/3)]"
        >
          <Image src={photo.url} alt={account.nomAffichage} fill unoptimized sizes="320px" className="object-cover" />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <section className="max-w-2xl">
          <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
            {account.nomAffichage}
          </h1>
          <p className="mt-3 text-lg text-foreground">{t("discoverAnimals")}</p>
        </section>

        <section className="mt-8">
          {especes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground">
              {t("emptyGalleries")}
            </p>
          ) : settings.dispositionEspeces === "cote_a_cote" ? (
            <ul className="grid grid-cols-2 gap-4 @min-[640px]:grid-cols-4">
              {especes.map((espece) => {
                const Icon = getEspeceIcon(espece.slug);
                const nom = tSpecies.has(espece.slug) ? tSpecies(espece.slug) : espece.nom;
                return (
                  <li
                    key={espece.id}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white px-4 py-6 text-center shadow-sm"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--account-secondary) text-(--account-primary)">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="font-heading text-base font-medium text-foreground">{nom}</span>
                  </li>
                );
              })}
            </ul>
          ) : settings.dispositionEspeces === "vitrine" ? (
            <ul className="grid grid-cols-2 gap-4 @min-[640px]:grid-cols-3">
              {especes.map((espece) => {
                const Icon = getEspeceIcon(espece.slug);
                const nom = tSpecies.has(espece.slug) ? tSpecies(espece.slug) : espece.nom;
                return (
                  <li
                    key={espece.id}
                    className="relative flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-(--account-secondary) p-4 text-center shadow-sm"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-(--account-primary) shadow-sm">
                      <Icon className="h-8 w-8" />
                    </span>
                    <span className="font-heading text-base font-medium text-foreground">{nom}</span>
                    {espece.animalCount > 0 && (
                      <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-(--account-primary) shadow-sm">
                        {espece.animalCount}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="flex flex-col gap-3">
              {especes.map((espece) => {
                const Icon = getEspeceIcon(espece.slug);
                const nom = tSpecies.has(espece.slug) ? tSpecies(espece.slug) : espece.nom;
                return (
                  <li
                    key={espece.id}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-white px-5 py-4 shadow-sm"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--account-secondary) text-(--account-primary)">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1 font-heading text-lg font-medium text-foreground">{nom}</span>
                    <ChevronRight className="h-5 w-5 text-foreground" />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {(hasPhotos || hasText) && (
          <section className="mt-12">
            <h2 className="font-heading text-xl font-medium text-foreground">{t("discoverUs")}</h2>

            {sideBySide ? (
              <div className="mt-4 flex flex-col gap-3 @min-[640px]:flex-row">
                {settings.dispositionPresentation === "texte_photo" ? (
                  <>
                    <div className="flex flex-1 flex-col justify-center rounded-2xl border border-border bg-white p-6 shadow-sm">
                      {textBlock}
                    </div>
                    {photosCluster}
                  </>
                ) : (
                  <>
                    {photosCluster}
                    <div className="flex flex-1 flex-col justify-center rounded-2xl border border-border bg-white p-6 shadow-sm">
                      {textBlock}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {hasText && <div className="mt-4 text-center">{textBlock}</div>}
                {hasPhotos && photosRow}
              </>
            )}
          </section>
        )}

        {(account.contactEmailPublic ||
          account.contactTelephonePublic ||
          (account.adresse && account.adresseVisible) ||
          (account.numeroEntreprise && account.numeroEntrepriseVisible)) && (
          <section className="mt-12 rounded-2xl bg-(--account-secondary) p-6">
            <p className="font-heading text-base font-medium text-foreground">{t("generalQuestion")}</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-foreground">
              {account.contactEmailPublic && (
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-(--account-primary)" />
                  {account.contactEmailPublic}
                </span>
              )}
              {account.contactTelephonePublic && (
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-(--account-primary)" />
                  {account.contactTelephonePublic}
                </span>
              )}
              {account.adresse && account.adresseVisible && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-(--account-primary)" />
                  {account.adresse}
                </span>
              )}
              {account.numeroEntreprise && account.numeroEntrepriseVisible && (
                <span className="inline-flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-(--account-primary)" />
                  {account.numeroEntreprise}
                </span>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
