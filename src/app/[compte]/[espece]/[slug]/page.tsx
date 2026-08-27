import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
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
import {
  getAccountBySlug,
  getEspeceBySlug,
  getAnimalVisibleBySlug,
  getPhotosForAnimal,
  getBadgesForAnimal,
  resolveContact,
  getSexeLabelKey,
  pickLocalized,
  localesWithContent,
} from "@/lib/mock";
import { createAdminClient } from "@/lib/supabase/admin";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { PrintButton } from "@/components/PrintButton";
import { ShareButton } from "@/components/ShareButton";
import { RecordAnimalView } from "@/components/RecordAnimalView";
import type { Locale } from "@/types";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ compte: string; espece: string; slug: string }>;
}): Promise<Metadata> {
  const { compte, espece: especeSlug, slug } = await params;
  const espece = getEspeceBySlug(especeSlug);
  if (!espece) return {};
  const supabase = createAdminClient();
  const account = await getAccountBySlug(supabase, compte);
  if (!account) return {};
  const animal = await getAnimalVisibleBySlug(supabase, account.id, espece.id, slug);
  if (!animal) return {};

  const locale = (await getLocale()) as Locale;
  const description = pickLocalized(animal.description, locale, account.langues_actives);
  const title = `${animal.nom} : à découvrir chez ${account.nom_affichage}`;
  const photos = await getPhotosForAnimal(supabase, animal.id);
  const url = `https://www.zoodomo.com/${account.slug}/${espece.slug}/${animal.slug}`;

  return {
    title,
    description: description ?? undefined,
    openGraph: {
      title,
      description: description ?? undefined,
      url,
      siteName: "Zoodomo",
      type: "website",
      images: photos[0] ? [{ url: photos[0].url }] : undefined,
    },
  };
}

export default async function AnimalPage({
  params,
}: {
  params: Promise<{ compte: string; espece: string; slug: string }>;
}) {
  const { compte, espece: especeSlug, slug } = await params;
  const supabase = createAdminClient();
  const account = await getAccountBySlug(supabase, compte);
  if (!account) notFound();

  const espece = getEspeceBySlug(especeSlug);
  if (!espece) notFound();

  const animal = await getAnimalVisibleBySlug(supabase, account.id, espece.id, slug);
  if (!animal) notFound();

  const [photos, badges] = await Promise.all([
    getPhotosForAnimal(supabase, animal.id),
    getBadgesForAnimal(supabase, animal.id),
  ]);
  const contact = resolveContact(animal, account);
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("animal");
  const tStatus = await getTranslations("status");
  const tLocales = await getTranslations("locales");

  const listFormatter = new Intl.ListFormat(locale === "en" ? "en" : locale, {
    style: "long",
    type: "conjunction",
  });
  const fallbackNote = (value: Partial<Record<Locale, string>>, resolved: string | null) =>
    resolved && !value[locale]
      ? t("textOnlyAvailableIn", {
          languages: listFormatter.format(localesWithContent(value).map((l) => tLocales(l))),
        })
      : null;

  const description = pickLocalized(animal.description, locale, account.langues_actives);
  const descriptionFallbackNote = fallbackNote(animal.description, description);
  const foyerIdeal = pickLocalized(animal.foyer_ideal, locale, account.langues_actives);
  const foyerIdealFallbackNote = fallbackNote(animal.foyer_ideal, foyerIdeal);

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
    infos.push({
      label: t("sexe"),
      value: t(sexeKey),
      icon: animal.sexe === "male" ? Mars : Venus,
    });
  if (animal.date_naissance)
    infos.push({
      label: t("birthDate"),
      value: new Date(animal.date_naissance).toLocaleDateString(locale === "en" ? "en-GB" : locale),
      icon: Cake,
    });
  else if (animal.annee_naissance)
    infos.push({
      label: t("birthYear"),
      value: String(animal.annee_naissance),
      icon: Cake,
    });
  if (animal.numero_identification)
    infos.push({
      label: t("idNumber"),
      value: animal.numero_identification,
      icon: Fingerprint,
    });
  if (animal.date_arrivee)
    infos.push({
      label: t("arrivalDate"),
      // "en-GB" plutôt que "en" : garde le format jour/mois/année, cohérent avec fr/nl,
      // attendu par le public belge visé même en interface anglaise (brief section 6).
      value: new Date(animal.date_arrivee).toLocaleDateString(
        locale === "en" ? "en-GB" : locale
      ),
      icon: CalendarDays,
    });
  if (animal.origine) infos.push({ label: t("origin"), value: animal.origine, icon: MapPin });
  if (animal.prix !== null)
    infos.push({
      label: t("price"),
      value: `${animal.prix} €`,
      icon: Tag,
    });

  // Les deux moyens de contact sont affichés côte à côte quand les deux sont renseignés
  // (retour utilisateur : avoir le téléphone ne doit pas faire disparaître l'email), au
  // lieu de n'en garder qu'un seul prioritaire. Le premier bouton disponible reste "primaire"
  // (rempli), le second passe en style secondaire (contour) pour garder une seule action
  // mise en avant visuellement.
  const contactButtons: { href: string; label: string; icon: LucideIcon }[] = [];
  if (contact.telephone) {
    contactButtons.push({
      href: `tel:${contact.telephone.replace(/\s+/g, "")}`,
      label: t("contactWithPhone", { phone: contact.telephone }),
      icon: Phone,
    });
  }
  if (contact.email) {
    contactButtons.push({
      href: `mailto:${contact.email}`,
      label: contact.telephone ? t("contactByEmail") : t("contact"),
      icon: Mail,
    });
  }

  // Horodatage affiché en bas à droite de la version imprimée uniquement (moment où la
  // page a été générée, faute de pouvoir connaître le moment exact du clic sur Imprimer
  // depuis un composant serveur).
  const printedAt = new Date().toLocaleString(locale === "en" ? "en-GB" : locale, {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 print:px-0 print:py-4">
      <RecordAnimalView animalId={animal.id} />
      {/* Version écran : masquée à l'impression (`print:hidden`), remplacée par la version
          imprimable ci-dessous qui suit un ordre et une mise en page différents (coordonnées
          du compte en haut à côté de son nom, infos avant les photos, tout compacté pour
          tenir sur une seule page, contrainte explicite de l'utilisateur). */}
      <div className="print:hidden">
        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
          <ShareButton label={t("share")} copiedLabel={t("linkCopied")} title={animal.nom} />
          <PrintButton label={t("print")} />
          <Link
            href={`/${account.slug}/${espece.slug}`}
            className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-foreground transition-colors hover:text-(--account-primary)"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToGallery")}
          </Link>
        </div>

        <div className="mt-6 grid gap-10 md:grid-cols-2">
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

            {contactButtons.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {contactButtons.map((btn, index) => (
                  <a
                    key={btn.href}
                    href={btn.href}
                    className={
                      index === 0
                        ? "inline-flex items-center justify-center gap-2 rounded-full bg-(--account-primary) px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                        : "inline-flex items-center justify-center gap-2 rounded-full border border-(--account-primary) px-6 py-3 text-sm font-semibold text-(--account-primary) transition-colors hover:bg-(--account-primary) hover:text-white"
                    }
                  >
                    <btn.icon className="h-4 w-4" />
                    {btn.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {description && (
          <section className="mt-12 max-w-3xl">
            <h2 className="font-heading text-xl font-medium text-foreground">
              {t("about", { name: animal.nom })}
            </h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground">
              {description}
            </p>
            {descriptionFallbackNote && (
              <p className="mt-2 text-sm text-amber-600">{descriptionFallbackNote}</p>
            )}
          </section>
        )}

        {foyerIdeal && (
          <section className="mt-8 max-w-3xl">
            <h2 className="font-heading text-xl font-medium text-foreground">
              {t("idealHome")}
            </h2>
            <ul className="mt-3 space-y-2">
              {foyerIdeal.split("\n").map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-foreground">
                  <Home className="mt-0.5 h-4 w-4 shrink-0 text-(--account-primary)" />
                  {line}
                </li>
              ))}
            </ul>
            {foyerIdealFallbackNote && (
              <p className="mt-2 text-sm text-amber-600">{foyerIdealFallbackNote}</p>
            )}
          </section>
        )}
      </div>

      {/* Version imprimable uniquement : les coordonnées du compte sont déjà dans l'en-tête
          de la page ([compte]/layout.tsx), pas répétées ici. Infos avant les photos (3 par
          ligne), description et foyer idéal, en espacements compacts pour tenir sur une
          seule page. */}
      <div className="hidden print:block">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
            {animal.nom}
          </h1>
          <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
            {tStatus(animal.statut)}
          </span>
        </div>

        {/* `print:break-inside-avoid` sur chaque bloc : si le contenu déborde sur une 2e
            page (texte long, beaucoup de photos...), un bloc entier passe à la page
            suivante plutôt que d'être coupé au milieu (ex. une rangée de photos tranchée
            en deux). Répond à la demande "mettre automatiquement les photos sur la 2e
            page" : ce n'est pas un placement forcé, mais le résultat naturel de ne jamais
            scinder un bloc, combiné à l'ordre infos → photos → description déjà en place. */}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 print:break-inside-avoid">
          {infos.map((info) => (
            <div key={info.label} className="flex items-start gap-2">
              <info.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--account-primary)" />
              <div>
                <dt className="text-[10px] text-foreground">{info.label}</dt>
                <dd className="text-sm font-medium text-foreground">{info.value}</dd>
              </div>
            </div>
          ))}
        </dl>

        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2 print:break-inside-avoid">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                {/* `loading="eager"` obligatoire ici : ce bloc est en `display: none` à l'écran,
                    donc le chargement paresseux par défaut de next/image ne se déclenche
                    jamais (aucune intersection observable), les photos restaient vides à
                    l'impression sans ce forçage. */}
                <Image
                  src={photo.url}
                  alt={animal.nom}
                  fill
                  unoptimized
                  loading="eager"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {description && (
          <div className="mt-4 print:break-inside-avoid">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              {t("about", { name: animal.nom })}
            </h2>
            <p className="mt-1 whitespace-pre-line text-sm leading-snug text-foreground">
              {description}
            </p>
          </div>
        )}

        {foyerIdeal && (
          <div className="mt-3 print:break-inside-avoid">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              {t("idealHome")}
            </h2>
            <ul className="mt-1 space-y-0.5">
              {foyerIdeal.split("\n").map((line) => (
                <li key={line} className="flex items-start gap-1.5 text-sm text-foreground">
                  <Home className="mt-0.5 h-3 w-3 shrink-0 text-(--account-primary)" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* `position: fixed` (pas un simple paragraphe en fin de contenu) : c'est ce qui
            permet à ce texte de se répéter en bas à droite de CHAQUE page imprimée, pas
            seulement de la dernière. CSS ne propose pas de vrai pied de page répété par
            page (les marges `@page` avec contenu ne sont pas prises en charge par les
            navigateurs) ; `position: fixed` en impression est le contournement pratique le
            plus fiable, en particulier sur Chrome. */}
        <p className="fixed bottom-2 right-4 text-[10px] text-foreground">
          {t("printedAt", { datetime: printedAt })}
        </p>
      </div>
    </div>
  );
}
