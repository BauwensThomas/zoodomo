import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { AlertCircle, CircleCheck, Clock, Eye, HeartHandshake, Rows3 } from "lucide-react";
import { getSessionAccount } from "@/lib/mock/auth";
import { createClient } from "@/lib/supabase/server";
import {
  listAnimauxByAccountAll,
  getEspeceById,
  getViewCount,
  visibiliteState,
  trialDaysRemaining,
} from "@/lib/mock";
import { STATUT_BADGE_CLASS } from "@/lib/statut-badge";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { MONTHLY_PRICE_EUR, ANNUAL_PRICE_EUR } from "@/lib/pricing";
import { TrialBanner } from "./TrialBanner";
import type { Locale } from "@/types";

export default async function DashboardPage() {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const t = await getTranslations("admin.dashboard");
  const tTrial = await getTranslations("admin.trialPopup");
  const tStatus = await getTranslations("status");
  const tSpecies = await getTranslations("species");
  const tForm = await getTranslations("admin.form");
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
  const formatBirth = (animal: { date_naissance: string | null; annee_naissance: number | null }) =>
    animal.date_naissance
      ? formatDate(animal.date_naissance)
      : animal.annee_naissance
        ? String(animal.annee_naissance)
        : t("notApplicable");
  const formatSexe = (sexe: "male" | "femelle" | null) =>
    sexe === "male" ? tForm("male") : sexe === "femelle" ? tForm("female") : t("notApplicable");
  const formatSterilise = (sterilise: boolean | null) =>
    sterilise === true ? tForm("yes") : sterilise === false ? tForm("no") : t("notApplicable");
  const formatPrix = (prix: number | null) => (prix !== null ? `${prix} €` : t("notApplicable"));

  const remainingTrialDays = trialDaysRemaining(account);

  const supabase = await createClient();
  const animaux = await listAnimauxByAccountAll(supabase, account.id);
  const disponibles = animaux.filter((a) => a.statut === "disponible").length;
  const reserves = animaux.filter((a) => a.statut === "reserve").length;
  const vuesParAnimal = new Map(
    await Promise.all(animaux.map(async (a) => [a.id, await getViewCount(supabase, a.id)] as const))
  );
  const vuesTotales = [...vuesParAnimal.values()].reduce((sum, v) => sum + v, 0);

  const now = new Date();
  const adoptedThisMonth = animaux.filter((a) => {
    if (!a.date_adoption) return false;
    const d = new Date(a.date_adoption);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const adoptedThisYear = animaux.filter((a) => {
    if (!a.date_adoption) return false;
    return new Date(a.date_adoption).getFullYear() === now.getFullYear();
  }).length;

  const statsBeforeAdopted = [
    { label: t("statTotal"), value: animaux.length, icon: Rows3 },
    { label: t("statAvailable"), value: disponibles, icon: CircleCheck },
    { label: t("statReserved"), value: reserves, icon: Clock },
  ];
  const statsAfterAdopted = [{ label: t("statViews"), value: vuesTotales, icon: Eye }];

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-foreground">
        {t("greeting", { name: account.nom_affichage })}
      </p>

      {remainingTrialDays !== null && remainingTrialDays >= 0 && (
        <TrialBanner
          daysText={t("trialBanner", { days: remainingTrialDays })}
          upgradeLink={t("trialUpgradeLink")}
          popup={{
            title: tTrial("title"),
            body: tTrial("body"),
            monthlyLabel: tTrial("monthlyLabel"),
            monthlyPrice: tTrial("monthlyPrice", { price: MONTHLY_PRICE_EUR }),
            annualLabel: tTrial("annualLabel"),
            annualPrice: tTrial("annualPrice", { price: ANNUAL_PRICE_EUR }),
            annualHint: tTrial("annualHint"),
            autoRenewNotice: tTrial("autoRenewNotice"),
            choose: tTrial("choose"),
            close: tTrial("close"),
          }}
        />
      )}

      {!account.adresse && (
        <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 p-3.5 text-sm text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="flex-1">{t("addressMissingNotice")}</p>
          <Link
            href="/espace/compte"
            className="shrink-0 whitespace-nowrap font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {t("addressMissingAction")}
          </Link>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-foreground bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">{t("publicUrlLabel")}</p>
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

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statsBeforeAdopted.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-foreground bg-card p-4">
            <stat.icon className="h-5 w-5 text-foreground" />
            <p className="mt-3 text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="text-xs text-foreground">{stat.label}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-foreground bg-card p-4">
          <HeartHandshake className="h-5 w-5 text-foreground" />
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {adoptedThisMonth}
            <span className="mx-1.5 font-normal text-foreground">/</span>
            {adoptedThisYear}
          </p>
          <p className="text-xs text-foreground">
            {t("statAdopted")} ({t("statThisMonth")} / {t("statThisYear")})
          </p>
        </div>
        {statsAfterAdopted.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-foreground bg-card p-4">
            <stat.icon className="h-5 w-5 text-foreground" />
            <p className="mt-3 text-2xl font-semibold text-foreground">{stat.value}</p>
            <p className="text-xs text-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-heading text-lg font-medium text-foreground">{t("latest")}</h2>
        <Link
          href="/espace/fiches"
          className="text-sm font-medium text-foreground transition-colors hover:opacity-70"
        >
          {t("viewAll")}
        </Link>
      </div>

      {animaux.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground">
          {t("empty")}{" "}
          <Link href="/espace/fiches/nouveau" className="font-medium text-foreground underline">
            {t("emptyCreate")}
          </Link>
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-foreground bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-foreground">
              <tr className="divide-x divide-border">
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colName")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colSpecies")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colRace")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colSex")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colNeutered")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colBirth")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colIdNumber")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colArrival")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colOrigin")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colPrice")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colStatus")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{t("colViews")}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {t("colCreated")}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
                  {t("colAdoptedDate")}
                </th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">
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
                  <tr key={animal.id} className="divide-x divide-border border-b border-border last:border-b-0">
                    <td className="whitespace-nowrap px-3 py-2">
                      {animal.statut === "disponible" ? (
                        <Link
                          href={`/espace/fiches/${animal.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {animal.nom}
                        </Link>
                      ) : (
                        <span className="font-medium text-foreground">{animal.nom}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground">{especeNom}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground">
                      {animal.race || t("notApplicable")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground">
                      {formatSexe(animal.sexe)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground">
                      {formatSterilise(animal.sterilise)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground">
                      {formatBirth(animal)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground">
                      {animal.numero_identification || t("notApplicable")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground">
                      {formatDate(animal.date_arrivee)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground">
                      {animal.origine || t("notApplicable")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground">
                      {formatPrix(animal.prix)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_BADGE_CLASS[animal.statut]}`}
                      >
                        {tStatus(animal.statut)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground">{vuesParAnimal.get(animal.id) ?? 0}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground">
                      {formatDate(animal.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-foreground">
                      {formatDate(animal.date_adoption)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">
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
