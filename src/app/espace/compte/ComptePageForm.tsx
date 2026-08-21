"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Building2, CheckCircle2, Globe, Info, Save, User } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { FieldLabel } from "@/components/FieldLabel";
import { AutoDismiss } from "@/components/AutoDismiss";
import { LanguesPresentationSection } from "./LanguesPresentationSection";
import { updateAccountAction, type SavedState } from "../actions";
import type { Account } from "@/types";

function inputClass() {
  return "mt-1.5 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground";
}

function disabledInputClass() {
  return "mt-1.5 w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground";
}

const initialState: SavedState = { saved: false };

export function ComptePageForm({
  account,
  lienRetourSite,
  photoUrls,
}: {
  account: Account;
  lienRetourSite: string | null;
  photoUrls: string[];
}) {
  const t = useTranslations("admin.compte");
  const tForm = useTranslations("admin.form");
  const optionalLabel = tForm("optional");
  const [state, formAction] = useActionState(updateAccountAction, initialState);
  const errorRef = useRef<HTMLDivElement>(null);
  const contactEmailRef = useRef<HTMLInputElement>(null);

  // Cette page évite volontairement toute navigation/scroll-jump vers le haut au clic sur
  // "Enregistrer" (formulaire long, voir DECISIONS.md), mais en cas d'erreur le champ
  // fautif peut ne pas être visible sur mobile/petits écrans : on scrolle spécifiquement
  // jusqu'à l'encart d'erreur et on remet le focus sur le premier champ concerné.
  useEffect(() => {
    if (state.error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      contactEmailRef.current?.focus();
    }
  }, [state.error]);

  return (
    <form action={formAction} className="mt-6 space-y-6">
      <div className="flex items-start gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 p-3.5 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{tForm("requiredHint")}</p>
      </div>

      <SectionCard icon={User} accent="indigo" title={t("sectionInfo")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel
              htmlFor="nom_affichage"
              label={t("displayName")}
              required
              optionalLabel={optionalLabel}
            />
            <input
              id="nom_affichage"
              name="nom_affichage"
              defaultValue={account.nom_affichage}
              required
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              {t("loginEmail")}
            </label>
            <input value={account.email} disabled className={disabledInputClass()} />
            <p className="mt-1 text-xs text-foreground">{t("loginEmailHint")}</p>
          </div>
          <div>
            <FieldLabel
              htmlFor="contact_email_public"
              label={t("publicEmail")}
              optionalLabel={optionalLabel}
            />
            <input
              ref={contactEmailRef}
              id="contact_email_public"
              name="contact_email_public"
              type="email"
              defaultValue={account.contact_email_public ?? undefined}
              className={inputClass()}
            />
          </div>
          <div>
            <FieldLabel
              htmlFor="contact_telephone_public"
              label={t("publicPhone")}
              optionalLabel={optionalLabel}
            />
            <input
              id="contact_telephone_public"
              name="contact_telephone_public"
              defaultValue={account.contact_telephone_public ?? undefined}
              className={inputClass()}
            />
          </div>
          <p className="text-xs text-foreground sm:col-span-2">{t("contactRequiredHint")}</p>
          {state.error && (
            <div
              ref={errorRef}
              className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-900 sm:col-span-2"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{state.error}</p>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard icon={Building2} accent="teal" title={t("sectionAddress")}>
        <div className="space-y-5">
          <div>
            <FieldLabel htmlFor="adresse" label={t("address")} optionalLabel={optionalLabel} />
            <textarea
              id="adresse"
              name="adresse"
              rows={2}
              defaultValue={account.adresse ?? undefined}
              className={inputClass()}
            />
            <label className="mt-3 flex items-center gap-2.5">
              <input
                type="checkbox"
                name="adresse_visible"
                defaultChecked={account.adresse_visible}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-foreground">{t("addressVisibleLabel")}</span>
            </label>
          </div>
          <div>
            <FieldLabel
              htmlFor="numero_entreprise"
              label={t("companyNumber")}
              optionalLabel={optionalLabel}
            />
            <input
              id="numero_entreprise"
              name="numero_entreprise"
              defaultValue={account.numero_entreprise ?? undefined}
              className={`${inputClass()} max-w-xs`}
            />
            <label className="mt-3 flex items-center gap-2.5">
              <input
                type="checkbox"
                name="numero_entreprise_visible"
                defaultChecked={account.numero_entreprise_visible}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-foreground">{t("companyNumberVisibleLabel")}</span>
            </label>
          </div>
        </div>
      </SectionCard>

      <LanguesPresentationSection
        initialLangues={account.langues_actives}
        aPropos={account.a_propos}
        photoUrls={photoUrls}
      />

      <SectionCard icon={Globe} accent="cyan" title={t("sectionWebsite")}>
        <div className="max-w-md">
          <FieldLabel
            htmlFor="lien_retour_site"
            label={t("websiteUrlLabel")}
            optionalLabel={optionalLabel}
          />
          <input
            id="lien_retour_site"
            name="lien_retour_site"
            type="url"
            placeholder={t("websiteUrlPlaceholder")}
            defaultValue={lienRetourSite ?? undefined}
            className={inputClass()}
          />
          <p className="mt-1 text-xs text-foreground">{t("websiteUrlHint")}</p>
        </div>
      </SectionCard>

      <div className="flex items-center justify-end gap-3">
        {state.saved && (
          <AutoDismiss key={state.savedAt}>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              {t("savedConfirmation")}
            </span>
          </AutoDismiss>
        )}
        <button
          type="submit"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Save className="h-4 w-4" />
          {t("save")}
        </button>
      </div>
    </form>
  );
}
