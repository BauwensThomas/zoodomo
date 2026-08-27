import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AlertCircle, ArrowLeft, Cake, Heart, Mars, Sparkles, Star, Tag, Venus } from "lucide-react";
import {
  getAccountBySlug,
  getAccountTheme,
  getEspeceBySlug,
  getAnimauxVisibles,
  getPhotosForAnimal,
  getBadgesForAnimal,
  getSexeLabelKey,
  pickLocalized,
  localesWithContent,
} from "@/lib/mock";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Animal, AnimalBadge, AnimalPhoto, Locale, TypeBadge } from "@/types";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ compte: string; espece: string }>;
}): Promise<Metadata> {
  const { compte, espece: especeSlug } = await params;
  const espece = getEspeceBySlug(especeSlug);
  if (!espece) return {};
  const account = await getAccountBySlug(createAdminClient(), compte);
  if (!account) return {};
  const tSpecies = await getTranslations("species");
  const nom = tSpecies.has(espece.slug) ? tSpecies(espece.slug) : espece.nom;
  const title = `${nom} disponibles chez ${account.nom_affichage}`;
  return {
    title,
    openGraph: {
      title,
      url: `https://www.zoodomo.com/${account.slug}/${espece.slug}`,
      siteName: "Zoodomo",
      type: "website",
    },
  };
}

const BADGE_ICONS: Record<TypeBadge, typeof Star> = {
  senior: Star,
  sos: AlertCircle,
  coeur_patient: Heart,
  adoptant_expert: Sparkles,
  autre: Sparkles,
};

const STATUT_DOT: Record<string, string> = {
  disponible: "bg-emerald-500",
  reserve: "bg-amber-500",
  adopte: "bg-neutral-400",
};

type Translator = (key: string, values?: Record<string, string | number>) => string;

interface CardProps {
  animal: Animal;
  photo: AnimalPhoto | undefined;
  badges: AnimalBadge[];
  href: string;
  statutLabel: string;
  priority: boolean;
  sizes: string;
  tAnimal: Translator;
  tLocales: Translator;
  locale: Locale;
  languesActives: Locale[];
}

function AnimalPhotoBox({ animal, photo, badges, statutLabel, priority, sizes }: CardProps) {
  return (
    <div className="relative aspect-4/3 bg-muted">
      {photo && (
        <Image
          src={photo.url}
          alt={animal.nom}
          fill
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized={photo.url.startsWith("data:")}
        />
      )}
      {badges.length > 0 && (
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {badges.map((badge) => {
            const BadgeIcon = BADGE_ICONS[badge.type];
            return (
              <span
                key={badge.id}
                className="inline-flex items-center gap-1 rounded-full bg-(--account-primary) px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
              >
                <BadgeIcon className="h-3 w-3" />
                {badge.label}
              </span>
            );
          })}
        </div>
      )}
      {animal.statut !== "disponible" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden bg-black/10">
          <span
            className={`-rotate-6 px-6 py-2 text-xl font-bold uppercase tracking-wide text-white shadow-lg ${
              animal.statut === "reserve" ? "bg-amber-500" : "bg-rose-500"
            }`}
          >
            {statutLabel}
          </span>
        </div>
      )}
    </div>
  );
}

function AnimalInfo({
  animal,
  statutLabel,
  tAnimal,
  tLocales,
  locale,
  languesActives,
  variant,
}: {
  animal: Animal;
  statutLabel: string;
  tAnimal: Translator;
  tLocales: Translator;
  locale: Locale;
  languesActives: Locale[];
  variant: "card" | "row";
}) {
  const sexeKey = getSexeLabelKey(animal);
  const age = animal.date_naissance
    ? new Date(animal.date_naissance).toLocaleDateString(locale === "en" ? "en-GB" : locale)
    : animal.annee_naissance
      ? String(animal.annee_naissance)
      : null;

  const description = pickLocalized(animal.description, locale, languesActives);
  const descriptionFallbackNote =
    description && !animal.description[locale]
      ? tAnimal("textOnlyAvailableIn", {
          languages: new Intl.ListFormat(locale === "en" ? "en" : locale, {
            style: "long",
            type: "conjunction",
          }).format(localesWithContent(animal.description).map((l) => tLocales(l))),
        })
      : null;

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

      {/* Sexe/âge/prix affichés dans les 3 dispositions (grille comprise, demande
          utilisateur du 2026-08-27) : utile en un coup d'œil sans avoir à ouvrir la fiche.
          Le prix n'a de sens qu'en "row" (plus de place), gardé conditionné à part
          ci-dessous ; description restée réservée à "row" (pas de place en grille). */}
      {(sexeKey || age || (variant === "row" && animal.prix !== null)) && (
        <div
          className={`mt-3 text-sm text-foreground ${
            variant === "card" ? "flex flex-col gap-1" : "flex flex-wrap gap-x-4 gap-y-2"
          }`}
        >
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
        <div className="mt-3">
          <p className="line-clamp-3 whitespace-pre-line text-sm text-foreground">{description}</p>
          {descriptionFallbackNote && (
            <p className="mt-1 text-xs text-amber-600">{descriptionFallbackNote}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Carte verticale (photo au-dessus, infos en dessous) : disposition "grille". */
function AnimalCard(props: CardProps) {
  return (
    <Link
      href={props.href}
      className="group block overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <AnimalPhotoBox {...props} />
      <AnimalInfo {...props} variant="card" />
    </Link>
  );
}

/** Ligne horizontale (photo à côté des infos) : dispositions "empilée" et "alternée". */
function AnimalRow(props: CardProps & { reverse: boolean }) {
  return (
    <Link
      href={props.href}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:shadow-lg sm:flex-row ${
        props.reverse ? "sm:flex-row-reverse" : ""
      }`}
    >
      <div className="sm:w-64 md:w-80 sm:shrink-0">
        <AnimalPhotoBox {...props} />
      </div>
      <div className="flex-1">
        <AnimalInfo {...props} variant="row" />
      </div>
    </Link>
  );
}

export default async function EspeceGaleriePage({
  params,
}: {
  params: Promise<{ compte: string; espece: string }>;
}) {
  const { compte, espece: especeSlug } = await params;
  const supabase = createAdminClient();
  const account = await getAccountBySlug(supabase, compte);
  if (!account) notFound();

  const espece = getEspeceBySlug(especeSlug);
  if (!espece) notFound();

  const animaux = await getAnimauxVisibles(supabase, account.id, espece.id);
  const theme = await getAccountTheme(supabase, account.id);
  const disposition = theme?.disposition_photos ?? "grille";
  const photosByAnimalId = new Map(
    await Promise.all(
      animaux.map(async (a) => [a.id, await getPhotosForAnimal(supabase, a.id)] as const)
    )
  );
  const badgesByAnimalId = new Map(
    await Promise.all(
      animaux.map(async (a) => [a.id, await getBadgesForAnimal(supabase, a.id)] as const)
    )
  );
  const t = await getTranslations("gallery");
  const tStatus = await getTranslations("status");
  const tSpecies = await getTranslations("species");
  const tAnimal = await getTranslations("animal");
  const tLocales = await getTranslations("locales");
  const locale = (await getLocale()) as Locale;
  const especeNom = tSpecies.has(espece.slug) ? tSpecies(espece.slug) : espece.nom;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
          {t("availableTitle", { species: especeNom })}
        </h1>
        <Link
          href={`/${account.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-(--account-primary)"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("allSpecies")}
        </Link>
      </div>

      {animaux.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground">
          {t("empty")}
        </p>
      ) : disposition === "empilee" || disposition === "alternee" ? (
        <div className="mt-8 flex flex-col gap-5">
          {animaux.map((animal, index) => {
            const photo = photosByAnimalId.get(animal.id)?.[0];
            const badges = badgesByAnimalId.get(animal.id) ?? [];
            return (
              <AnimalRow
                key={animal.id}
                animal={animal}
                photo={photo}
                badges={badges}
                href={`/${account.slug}/${espece.slug}/${animal.slug}`}
                statutLabel={tStatus(animal.statut)}
                priority={index === 0}
                sizes="(min-width: 640px) 320px, 100vw"
                tAnimal={tAnimal}
                tLocales={tLocales}
                locale={locale}
                languesActives={account.langues_actives}
                reverse={disposition === "alternee" && index % 2 === 1}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          {animaux.map((animal, index) => {
            const photo = photosByAnimalId.get(animal.id)?.[0];
            const badges = badgesByAnimalId.get(animal.id) ?? [];
            return (
              <AnimalCard
                key={animal.id}
                animal={animal}
                photo={photo}
                badges={badges}
                href={`/${account.slug}/${espece.slug}/${animal.slug}`}
                statutLabel={tStatus(animal.statut)}
                priority={index === 0}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                tAnimal={tAnimal}
                tLocales={tLocales}
                locale={locale}
                languesActives={account.langues_actives}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
