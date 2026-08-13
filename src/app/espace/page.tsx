import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { CircleCheck, Clock, Eye, Rows3 } from "lucide-react";
import { getSessionAccount } from "@/lib/mock/auth";
import { listAnimauxByAccountAll, getEspeceById, getViewCount, visibiliteState } from "@/lib/mock";
import { STATUT_BADGE_CLASS } from "@/lib/statut-badge";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import type { Locale } from "@/types";

export default async function DashboardPage() {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const t = await getTranslations("admin.dashboard");
  const tStatus = await getTranslations("status");
  const tSpecies = await getTranslations("species");
  const locale = (await getLocale()) as Locale;
  const dateLocale = locale === "en" ? "en-GB" : locale;

  // Domaine reconstruit depuis la requête (pas encore de domaine fixe en phase mockée) :
  // fonctionne en local (localhost) comme en production une fois déployé, sans config à part.
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/${account.slug}`;

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(dateLocale) : t("notApplicable");

  const animaux = listAnimauxByAccountAll(account.id);
  const disponibles = animaux.filter((a) => a.statut === "disponible").length;
  const reserves = animaux.filter((a) => a.statut === "reserve").length;
  const vuesTotales = animaux.reduce((sum, a) => sum + getViewCount(a.id), 0);

  const stats = [
    { label: t("statTotal"), value: animaux.length, icon: Rows3 },
    { label: t("statAvailable"), value: disponibles, icon: CircleCheck },
    { label: t("statReserved"), value: reserves, icon: Clock },
    { label: t("statViews"), value: vuesTotales, icon: Eye },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        {t("greeting", { name: account.nom_affichage })}
      </p>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground/50">{t("publicUrlLabel")}</p>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-medium text-foreground hover:underline"
          >
            {publicUrl}
          </a>
        </div>
        <CopyLinkButton
          value={publicUrl}
          label={t("copyLink")}
          copiedLabel={t("copyLinkCopied")}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-white p-4">
            <stat.icon className="h-5 w-5 text-foreground/40" />
            <p className="mt-3 text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="text-xs text-foreground/60">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-heading text-lg font-medium text-foreground">{t("latest")}</h2>
        <Link
          href="/espace/fiches"
          className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
        >
          {t("viewAll")}
        </Link>
      </div>

      {animaux.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground/60">
          {t("empty")}{" "}
          <Link href="/espace/fiches/nouveau" className="font-medium text-foreground underline">
            {t("emptyCreate")}
          </Link>
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-foreground/50">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("colName")}</th>
                <th className="px-4 py-2.5 font-medium">{t("colSpecies")}</th>
                <th className="px-4 py-2.5 font-medium">{t("colStatus")}</th>
                <th className="px-4 py-2.5 font-medium">{t("colViews")}</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">
                  {t("colCreated")}
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">
                  {t("colAdoptedDate")}
                </th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">
                  {t("colVisibleDays")}
                </th>
              </tr>
            </thead>
            <tbody>
              {animaux.slice(0, 5).map((animal) => {
                const espece = getEspeceById(animal.espece_id);
                const especeNom = espece
                  ? tSpecies.has(espece.slug)
                    ? tSpecies(espece.slug)
                    : espece.nom
                  : "-";
                return (
                  <tr key={animal.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/espace/fiches/${animal.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {animal.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-foreground/70">{especeNom}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_BADGE_CLASS[animal.statut]}`}
                      >
                        {tStatus(animal.statut)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-foreground/70">{getViewCount(animal.id)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-foreground/70">
                      {formatDate(animal.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-foreground/70">
                      {formatDate(animal.date_adoption)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium text-foreground">
                      {(() => {
                        const visResult = visibiliteState(animal);
                        return visResult.state === "days"
                          ? t("visibleDaysValue", { days: visResult.days })
                          : visResult.state === "lastDay"
                            ? t("visibleLastDayValue")
                            : visResult.state === "expired"
                              ? t("visibleExpiredValue")
                              : t("notApplicable");
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
