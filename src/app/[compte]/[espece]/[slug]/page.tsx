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
import { PhotoCarousel } from "@/components/PhotoCarousel";
import type { Locale } from "@/types";

export default async function AnimalPage({
  params,
}: {
  params: Promise<{ compte: string; espece: string; slug: string }>;
}) {
  const { compte, espece: especeSlug, slug } = await params;
  const account = getAccountBySlug(compte);
  if (!account) notFound();

  const espece = getEspeceBySlug(especeSlug);
  if (!espece) notFound();

  const animal = getAnimalVisibleBySlug(account.id, espece.id, slug);
  if (!animal) notFound();

  const photos = getPhotosForAnimal(animal.id);
  const badges = getBadgesForAnimal(animal.id);
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

  let contactHref: string | null = null;
  let contactLabel = t("contact");
  let ContactIcon = Mail;
  if (contact.telephone) {
    contactHref = `tel:${contact.telephone.replace(/\s+/g, "")}`;
    contactLabel = t("contactWithPhone", { phone: contact.telephone });
    ContactIcon = Phone;
  } else if (contact.email) {
    contactHref = `mailto:${contact.email}`;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex justify-end">
        <Link
          href={`/${account.slug}/${espece.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 transition-colors hover:text-(--account-primary)"
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
            <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground/70">
              {tStatus(animal.statut)}
            </span>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
            {infos.map((info) => (
              <div key={info.label} className="flex items-start gap-2.5">
                <info.icon className="mt-0.5 h-4 w-4 shrink-0 text-(--account-primary)" />
                <div>
                  <dt className="text-xs text-foreground/50">{info.label}</dt>
                  <dd className="font-medium text-foreground">{info.value}</dd>
                </div>
              </div>
            ))}
          </dl>

          {contactHref && (
            <a
              href={contactHref}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-(--account-primary) px-6 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <ContactIcon className="h-4 w-4" />
              {contactLabel}
            </a>
          )}
        </div>
      </div>

      {description && (
        <section className="mt-12 max-w-3xl">
          <h2 className="font-heading text-xl font-medium text-foreground">
            {t("about", { name: animal.nom })}
          </h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/70">
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
              <li key={line} className="flex items-start gap-2.5 text-foreground/70">
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
  );
}
