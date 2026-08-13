import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AlertCircle, ArrowLeft, Heart, Sparkles, Star } from "lucide-react";
import {
  getAccountBySlug,
  getEspeceBySlug,
  getAnimauxVisibles,
  getPhotosForAnimal,
  getBadgesForAnimal,
} from "@/lib/mock";
import type { TypeBadge } from "@/types";

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

export default async function EspeceGaleriePage({
  params,
}: {
  params: Promise<{ compte: string; espece: string }>;
}) {
  const { compte, espece: especeSlug } = await params;
  const account = getAccountBySlug(compte);
  if (!account) notFound();

  const espece = getEspeceBySlug(especeSlug);
  if (!espece) notFound();

  const animaux = getAnimauxVisibles(account.id, espece.id);
  const t = await getTranslations("gallery");
  const tStatus = await getTranslations("status");
  const tSpecies = await getTranslations("species");
  const especeNom = tSpecies.has(espece.slug) ? tSpecies(espece.slug) : espece.nom;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
          {t("availableTitle", { species: especeNom })}
        </h1>
        <Link
          href={`/${account.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 transition-colors hover:text-(--account-primary)"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("allSpecies")}
        </Link>
      </div>

      {animaux.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground/60">
          {t("empty")}
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {animaux.map((animal, index) => {
            const photo = getPhotosForAnimal(animal.id)[0];
            const badges = getBadgesForAnimal(animal.id);

            return (
              <Link
                key={animal.id}
                href={`/${account.slug}/${espece.slug}/${animal.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-4/3 bg-muted">
                  {photo && (
                    <Image
                      src={photo.url}
                      alt={animal.nom}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      priority={index === 0}
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
                        {tStatus(animal.statut)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-lg font-medium text-foreground">
                      {animal.nom}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/60">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${STATUT_DOT[animal.statut]}`}
                      />
                      {tStatus(animal.statut)}
                    </span>
                  </div>
                  {animal.race && (
                    <p className="mt-1 text-sm text-foreground/50">
                      {animal.race}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
