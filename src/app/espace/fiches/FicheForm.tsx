"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Award,
  CircleDollarSign,
  FileText,
  Image as ImageIcon,
  Info,
  Phone,
  Save,
  Tags,
  User,
} from "lucide-react";
import { PhotoUploadField } from "@/components/PhotoUploadField";
import { SectionCard } from "@/components/SectionCard";
import { FieldLabel } from "@/components/FieldLabel";
import type { Animal, AnimalBadge, AnimalPhoto, Espece, Locale } from "@/types";

function inputClass() {
  return "mt-1.5 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground";
}

interface FicheFormProps {
  action: (formData: FormData) => void | Promise<void>;
  accountId: string;
  especes: Espece[];
  languesActives: Locale[];
  animal?: Animal;
  badges?: AnimalBadge[];
  photos?: AnimalPhoto[];
  submitLabel: string;
}

export function FicheForm({
  action,
  accountId,
  especes,
  languesActives,
  animal,
  badges = [],
  photos = [],
  submitLabel,
}: FicheFormProps) {
  const [especeId, setEspeceId] = useState(animal?.espece_id ?? especes[0]?.id ?? "");

  const t = useTranslations("admin.form");
  const tStatus = useTranslations("status");
  const tLocales = useTranslations("locales");
  const tSpecies = useTranslations("species");

  const optionalLabel = t("optional");

  const currentYear = new Date().getFullYear();
  const existingBadge = badges[0];

  return (
    <form action={action} className="space-y-6">
      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 p-3.5 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t("requiredHint")}</p>
      </div>

      <SectionCard icon={User} accent="indigo" title={t("sectionIdentity")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="nom" label={t("name")} required optionalLabel={optionalLabel} />
            <input
              id="nom"
              name="nom"
              required
              defaultValue={animal?.nom}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel
              htmlFor="espece_id"
              label={t("species")}
              required
              optionalLabel={optionalLabel}
            />
            <select
              id="espece_id"
              name="espece_id"
              value={especeId}
              onChange={(e) => setEspeceId(e.target.value)}
              className={inputClass()}
            >
              {especes.map((e) => (
                <option key={e.id} value={e.id}>
                  {tSpecies.has(e.slug) ? tSpecies(e.slug) : e.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel
              htmlFor="race"
              label={t("subspecies")}
              optionalLabel={optionalLabel}
            />
            <input
              id="race"
              name="race"
              defaultValue={animal?.race ?? undefined}
              placeholder={t("subspeciesPlaceholder")}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel htmlFor="sexe" label={t("sex")} optionalLabel={optionalLabel} />
            <select id="sexe" name="sexe" defaultValue={animal?.sexe ?? ""} className={inputClass()}>
              <option value="">{t("notSpecified")}</option>
              <option value="male">{t("male")}</option>
              <option value="femelle">{t("female")}</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="sterilise" label={t("neutered")} optionalLabel={optionalLabel} />
            <select
              id="sterilise"
              name="sterilise"
              defaultValue={
                animal?.sterilise === undefined || animal?.sterilise === null
                  ? ""
                  : String(animal.sterilise)
              }
              className={inputClass()}
            >
              <option value="">{t("notSpecified")}</option>
              <option value="true">{t("yes")}</option>
              <option value="false">{t("no")}</option>
            </select>
          </div>
          <div>
            <FieldLabel
              htmlFor="annee_naissance"
              label={t("birthYear")}
              optionalLabel={optionalLabel}
            />
            <input
              id="annee_naissance"
              name="annee_naissance"
              type="number"
              min={1990}
              max={currentYear}
              defaultValue={animal?.annee_naissance ?? undefined}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel
              htmlFor="date_naissance"
              label={t("birthDatePrecise")}
              optionalLabel={optionalLabel}
            />
            <input
              id="date_naissance"
              name="date_naissance"
              type="date"
              defaultValue={animal?.date_naissance ?? undefined}
              className={inputClass()}
            />
            <p className="mt-1 text-xs text-foreground">{t("birthDatePreciseHint")}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Tags} accent="purple" title={t("sectionTraceability")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel
              htmlFor="numero_identification"
              label={t("idNumber")}
              optionalLabel={optionalLabel}
            />
            <input
              id="numero_identification"
              name="numero_identification"
              defaultValue={animal?.numero_identification ?? undefined}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel
              htmlFor="date_arrivee"
              label={t("arrivalDate")}
              optionalLabel={optionalLabel}
            />
            <input
              id="date_arrivee"
              name="date_arrivee"
              type="date"
              defaultValue={animal?.date_arrivee ?? undefined}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel htmlFor="origine" label={t("origin")} optionalLabel={optionalLabel} />
            <input
              id="origine"
              name="origine"
              defaultValue={animal?.origine ?? undefined}
              className={inputClass()}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={CircleDollarSign}
        accent="emerald"
        title={t("sectionStatusPrice")}
        hint={t("statusHint")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="statut" label={t("status")} required optionalLabel={optionalLabel} />
            <select
              id="statut"
              name="statut"
              defaultValue={animal?.statut ?? "disponible"}
              className={inputClass()}
            >
              <option value="disponible">{tStatus("disponible")}</option>
              <option value="reserve">{tStatus("reserve")}</option>
              <option value="adopte">{tStatus("adopte")}</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="prix" label={t("price")} optionalLabel={optionalLabel} />
            <input
              id="prix"
              name="prix"
              type="number"
              min={0}
              step="1"
              defaultValue={animal?.prix ?? undefined}
              className={inputClass()}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={FileText} accent="amber" title={t("sectionContent")} hint={t("contentHint")}>
        <div className="space-y-6">
          {languesActives.map((locale) => (
            <div key={locale} className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold text-foreground">{tLocales(locale)}</p>
              <div className="mt-3">
                <FieldLabel
                  htmlFor={`description_${locale}`}
                  label={t("description")}
                  optionalLabel={optionalLabel}
                />
                <textarea
                  id={`description_${locale}`}
                  name={`description_${locale}`}
                  rows={3}
                  defaultValue={animal?.description?.[locale]}
                  className={`${inputClass()} bg-card`}
                />
              </div>
              <div className="mt-3">
                <FieldLabel
                  htmlFor={`foyer_ideal_${locale}`}
                  label={t("idealHome")}
                  optionalLabel={optionalLabel}
                />
                <textarea
                  id={`foyer_ideal_${locale}`}
                  name={`foyer_ideal_${locale}`}
                  rows={3}
                  defaultValue={animal?.foyer_ideal?.[locale]}
                  className={`${inputClass()} bg-card`}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        icon={Award}
        accent="pink"
        title={t("sectionBadges")}
        hint={`${t("badgesHint")} (${optionalLabel})`}
      >
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-3">
          <div className="relative flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-muted">
            <ImageIcon className="h-6 w-6 text-foreground" />
            <span className="absolute left-1.5 top-1.5 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
              {t("badgeSenior")}
            </span>
          </div>
          <p className="text-xs text-foreground">{t("badgePreviewCaption")}</p>
        </div>
        <div className="mt-3">
          <FieldLabel htmlFor="badge_label" label={t("badgeLabel")} optionalLabel={optionalLabel} />
          <input
            type="text"
            id="badge_label"
            name="badge_label"
            placeholder={t("badgeLabelPlaceholder")}
            defaultValue={existingBadge?.label ?? ""}
            className={`${inputClass()} max-w-xs`}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={ImageIcon}
        accent="cyan"
        title={t("sectionPhotos")}
        hint={`${t("photosHint")} (${optionalLabel})`}
      >
        <PhotoUploadField
          name="photos"
          accountId={accountId}
          category="animals"
          defaultPhotos={photos.map((p) => p.url)}
          maxPhotos={5}
          dropLabel={t("photosDropLabel")}
          maxReachedLabel={t("photosMaxReached")}
          removeLabel={t("photosRemoveAria")}
          uploadErrorLabel={t("photosUploadError")}
        />
      </SectionCard>

      <SectionCard
        icon={Phone}
        accent="teal"
        title={t("sectionContact")}
        hint={`${t("contactHint")} (${optionalLabel})`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel
              htmlFor="contact_email"
              label={t("contactEmail")}
              optionalLabel={optionalLabel}
            />
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={animal?.contact_email ?? undefined}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel
              htmlFor="contact_telephone"
              label={t("contactPhone")}
              optionalLabel={optionalLabel}
            />
            <input
              id="contact_telephone"
              name="contact_telephone"
              defaultValue={animal?.contact_telephone ?? undefined}
              className={inputClass()}
            />
          </div>
        </div>
      </SectionCard>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Save className="h-4 w-4" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
