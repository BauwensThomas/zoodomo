"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Images, Languages } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { FieldLabel } from "@/components/FieldLabel";
import { PhotoUploadField } from "@/components/PhotoUploadField";
import { LOCALES, type Locale } from "@/types";

function inputClass() {
  return "mt-1.5 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground";
}

export function LanguesPresentationSection({
  accountId,
  initialLangues,
  aPropos,
  photoUrls,
}: {
  accountId: string;
  initialLangues: Locale[];
  aPropos: Partial<Record<Locale, string>>;
  photoUrls: string[];
}) {
  const t = useTranslations("admin.compte");
  const tForm = useTranslations("admin.form");
  const tLocales = useTranslations("locales");
  const optionalLabel = tForm("optional");

  // État local pour que "Présentation" réagisse tout de suite quand une langue est
  // décochée ici, sans devoir d'abord enregistrer : sinon le champ texte de cette langue
  // reste affiché et, s'il n'est pas vidé à la main, repart avec l'ancien contenu au
  // prochain enregistrement (signalé par l'utilisateur).
  const [langues, setLangues] = useState<Locale[]>(initialLangues);

  function toggleLocale(locale: Locale) {
    setLangues((prev) =>
      prev.includes(locale) ? prev.filter((l) => l !== locale) : [...prev, locale]
    );
  }

  return (
    <>
      <SectionCard icon={Languages} accent="purple" title={t("sectionLangues")} hint={t("languesHint")}>
        <div className="space-y-2">
          {LOCALES.map((locale) => (
            <label
              key={locale}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
            >
              <input
                type="checkbox"
                name={`langue_${locale}`}
                checked={langues.includes(locale)}
                onChange={() => toggleLocale(locale)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-foreground">{tLocales(locale)}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Images} accent="pink" title={t("sectionAbout")} hint={t("aboutHint")}>
        <div className="space-y-6">
          {langues.map((locale) => (
            <div key={locale} className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold text-foreground">{tLocales(locale)}</p>
              <div className="mt-3">
                <FieldLabel
                  htmlFor={`a_propos_${locale}`}
                  label={t("aboutLabel")}
                  optionalLabel={optionalLabel}
                />
                <textarea
                  id={`a_propos_${locale}`}
                  name={`a_propos_${locale}`}
                  rows={3}
                  defaultValue={aPropos[locale]}
                  className={inputClass()}
                />
              </div>
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-foreground">
              {t("aboutPhotosLabel")}
            </label>
            <PhotoUploadField
              name="account_photos"
              accountId={accountId}
              category="account"
              defaultPhotos={photoUrls}
              maxPhotos={2}
              dropLabel={tForm("photosDropLabel")}
              maxReachedLabel={t("aboutPhotosMaxReached")}
              removeLabel={tForm("photosRemoveAria")}
              uploadErrorLabel={t("aboutPhotosUploadError")}
            />
          </div>
        </div>
      </SectionCard>
    </>
  );
}
