import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronRight, Mail, Phone } from "lucide-react";
import {
  getAccountBySlug,
  getAccountPhotos,
  getEspecesAvecAnimauxVisibles,
} from "@/lib/mock";
import { getEspeceIcon } from "@/lib/species-icons";

export default async function CompteIndexPage({
  params,
}: {
  params: Promise<{ compte: string }>;
}) {
  const { compte } = await params;
  const account = getAccountBySlug(compte);
  if (!account) notFound();

  const especes = getEspecesAvecAnimauxVisibles(account.id);
  const photos = getAccountPhotos(account.id);
  const t = await getTranslations("account");
  const tSpecies = await getTranslations("species");

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <section className="max-w-2xl">
        <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
          {account.nom_affichage}
        </h1>
        <p className="mt-3 text-lg text-foreground/70">{t("discoverAnimals")}</p>
      </section>

      <section className="mt-8">
        {especes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground/60">
            {t("emptyGalleries")}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
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
                    <ChevronRight className="h-5 w-5 text-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-(--account-primary)" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {photos.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-xl font-medium text-foreground">
            {t("discoverUs")}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm"
              >
                <Image
                  src={photo.url}
                  alt={account.nom_affichage}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  priority={index < 3}
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {(account.contact_email_public || account.contact_telephone_public) && (
        <section className="mt-12 rounded-2xl bg-muted p-6">
          <p className="font-heading text-base font-medium text-foreground">
            {t("generalQuestion")}
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-foreground/70">
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
          </div>
        </section>
      )}
    </div>
  );
}
