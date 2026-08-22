import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Building2, ChevronRight, Mail, MapPin, Phone } from "lucide-react";
import {
  getAccountBySlug,
  getAccountPhotos,
  getAccountTheme,
  getAnimauxVisibles,
  getEspecesAvecAnimauxVisibles,
  pickLocalized,
  localesWithContent,
} from "@/lib/mock";
import { getEspeceIcon } from "@/lib/species-icons";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/types";

export default async function CompteIndexPage({
  params,
}: {
  params: Promise<{ compte: string }>;
}) {
  const { compte } = await params;
  const supabase = createAdminClient();
  const account = await getAccountBySlug(supabase, compte);
  if (!account) notFound();

  const especes = await getEspecesAvecAnimauxVisibles(supabase, account.id);
  const [photos, theme] = await Promise.all([
    getAccountPhotos(supabase, account.id),
    getAccountTheme(supabase, account.id),
  ]);
  const especeAnimalCounts = new Map(
    await Promise.all(
      especes.map(async (e) => [e.id, (await getAnimauxVisibles(supabase, account.id, e.id)).length] as const)
    )
  );
  const dispositionEspeces = theme?.disposition_especes ?? "liste";
  const dispositionPresentation = theme?.disposition_presentation ?? "photo_texte";
  const t = await getTranslations("account");
  const tAnimal = await getTranslations("animal");
  const tSpecies = await getTranslations("species");
  const tLocales = await getTranslations("locales");
  const locale = (await getLocale()) as Locale;

  const listFormatter = new Intl.ListFormat(locale === "en" ? "en" : locale, {
    style: "long",
    type: "conjunction",
  });
  const aPropos = pickLocalized(account.a_propos, locale, account.langues_actives);
  const aProposFallbackNote =
    aPropos && !account.a_propos[locale]
      ? tAnimal("textOnlyAvailableIn", {
          languages: listFormatter.format(localesWithContent(account.a_propos).map((l) => tLocales(l))),
        })
      : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <section className="max-w-2xl">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
          {account.nom_affichage}
        </h1>
        <p className="mt-3 text-lg text-foreground">{t("discoverAnimals")}</p>
      </section>

      <section className="mt-8">
        {especes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground">
            {t("emptyGalleries")}
          </p>
        ) : dispositionEspeces === "cote_a_cote" ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {especes.map((espece) => {
              const Icon = getEspeceIcon(espece.slug);
              const nom = tSpecies.has(espece.slug) ? tSpecies(espece.slug) : espece.nom;
              return (
                <li key={espece.id}>
                  <Link
                    href={`/${account.slug}/${espece.slug}`}
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-white px-4 py-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-(--account-primary) hover:shadow-md"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--account-secondary) text-(--account-primary)">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="font-heading text-base font-medium text-foreground">
                      {nom}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : dispositionEspeces === "vitrine" ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {especes.map((espece) => {
              const Icon = getEspeceIcon(espece.slug);
              const nom = tSpecies.has(espece.slug) ? tSpecies(espece.slug) : espece.nom;
              const count = especeAnimalCounts.get(espece.id) ?? 0;
              return (
                <li key={espece.id}>
                  <Link
                    href={`/${account.slug}/${espece.slug}`}
                    className="group relative flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-(--account-secondary) p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-(--account-primary) shadow-sm">
                      <Icon className="h-8 w-8" />
                    </span>
                    <span className="font-heading text-base font-medium text-foreground">
                      {nom}
                    </span>
                    {count > 0 && (
                      <span
                        aria-label={t("speciesCount", { count })}
                        className="absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-(--account-primary) shadow-sm"
                      >
                        {count}
                      </span>
                    )}
                  </Link>
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
                <li key={espece.id}>
                  <Link
                    href={`/${account.slug}/${espece.slug}`}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-white px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-(--account-primary) hover:shadow-md"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--account-secondary) text-(--account-primary)">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1 font-heading text-lg font-medium text-foreground">
                      {nom}
                    </span>
                    <ChevronRight className="h-5 w-5 text-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-(--account-primary)" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(() => {
        const hasPhotos = photos.length > 0;
        const hasText = !!aPropos;
        if (!hasPhotos && !hasText) return null;

        // "Photo et texte"/"Texte et photo" ne prennent leur disposition à deux colonnes
        // que s'il y a vraiment les deux à afficher ; sinon on retombe sur le bloc texte
        // pleine largeur suivi de la grille de photos, comme "Texte puis photos".
        const sideBySide =
          (dispositionPresentation === "photo_texte" || dispositionPresentation === "texte_photo") &&
          hasPhotos &&
          hasText;

        const textBlock = (
          <div>
            <p className="whitespace-pre-line text-foreground">{aPropos}</p>
            {aProposFallbackNote && (
              <p className="mt-2 text-sm text-amber-600">{aProposFallbackNote}</p>
            )}
          </div>
        );

        // "Photo et texte"/"Texte et photo" : les photos gardent un format carré normal
        // (pas de découpe en bandes fines pour égaler la hauteur du texte, ça rognait mal
        // les photos sur 2-3 photos). Le cadre de texte s'étire pour matcher la colonne
        // photo (`items-stretch` par défaut sur la grille), quitte à laisser du blanc en
        // dessous du texte si celui-ci est plus court que la pile de photos.
        const photosCluster = (
          <div className="flex shrink-0 flex-col items-center gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square w-72 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm sm:w-80"
              >
                <Image
                  src={photo.url}
                  alt={account.nom_affichage}
                  fill
                  sizes="320px"
                  unoptimized={photo.url.startsWith("data:")}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        );

        // "Texte puis photos" : des photos de taille normale (comme une grille classique),
        // simplement centrées en rangée plutôt qu'ancrées à gauche s'il y en a moins de 3.
        const photosRow = (
          <div className={`mt-4 flex flex-wrap gap-3 ${photos.length < 3 ? "justify-center" : ""}`}>
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square w-[calc((100%-0.75rem)/2)] shrink-0 overflow-hidden rounded-2xl bg-muted shadow-sm sm:w-[calc((100%-1.5rem)/3)]"
              >
                <Image
                  src={photo.url}
                  alt={account.nom_affichage}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  loading={index < 3 ? "eager" : "lazy"}
                  unoptimized={photo.url.startsWith("data:")}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        );

        return (
          <section className="mt-12">
            <h2 className="font-heading text-xl font-medium text-foreground">
              {t("discoverUs")}
            </h2>

            {sideBySide ? (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                {dispositionPresentation === "texte_photo" ? (
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
        );
      })()}

      {(account.contact_email_public ||
        account.contact_telephone_public ||
        (account.adresse && account.adresse_visible) ||
        (account.numero_entreprise && account.numero_entreprise_visible)) && (
        <section className="mt-12 rounded-2xl bg-(--account-secondary) p-6">
          <p className="font-heading text-base font-medium text-foreground">
            {t("generalQuestion")}
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-foreground">
            {account.contact_email_public && (
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-(--account-primary)" />
                {account.contact_email_public}
              </span>
            )}
            {account.contact_telephone_public && (
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-(--account-primary)" />
                {account.contact_telephone_public}
              </span>
            )}
            {account.adresse && account.adresse_visible && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-(--account-primary)" />
                {account.adresse}
              </span>
            )}
            {account.numero_entreprise && account.numero_entreprise_visible && (
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-4 w-4 text-(--account-primary)" />
                {account.numero_entreprise}
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
