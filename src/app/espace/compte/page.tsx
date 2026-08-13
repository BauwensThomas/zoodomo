import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionAccount } from "@/lib/mock/auth";
import { LOCALES } from "@/types";
import { updateLanguesActivesAction, updateAccountInfoAction } from "../actions";

function inputClass() {
  return "mt-1.5 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground";
}

function disabledInputClass() {
  return "mt-1.5 w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground/70";
}

export default async function ComptePage() {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const t = await getTranslations("admin.compte");
  const tLocales = await getTranslations("locales");

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("title")}
      </h1>

      <section className="mt-6">
        <h2 className="font-heading text-lg font-medium text-foreground">
          {t("sectionInfo")}
        </h2>
        <form action={updateAccountInfoAction} className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nom_affichage" className="block text-sm font-medium text-foreground">
              {t("displayName")}
            </label>
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
          </div>
          <div>
            <label
              htmlFor="contact_email_public"
              className="block text-sm font-medium text-foreground"
            >
              {t("publicEmail")}
            </label>
            <input
              id="contact_email_public"
              name="contact_email_public"
              type="email"
              defaultValue={account.contact_email_public ?? undefined}
              className={inputClass()}
            />
          </div>
          <div>
            <label
              htmlFor="contact_telephone_public"
              className="block text-sm font-medium text-foreground"
            >
              {t("publicPhone")}
            </label>
            <input
              id="contact_telephone_public"
              name="contact_telephone_public"
              defaultValue={account.contact_telephone_public ?? undefined}
              className={inputClass()}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex cursor-pointer items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              {t("save")}
            </button>
          </div>
        </form>
        <p className="mt-2 text-xs text-foreground/60">{t("loginEmailHint")}</p>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-lg font-medium text-foreground">
          {t("sectionLangues")}
        </h2>
        <p className="mt-1 text-sm text-foreground/70">{t("languesHint")}</p>

        <form action={updateLanguesActivesAction} className="mt-4 space-y-2">
          {LOCALES.map((locale) => (
            <label
              key={locale}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
            >
              <input
                type="checkbox"
                name={`langue_${locale}`}
                defaultChecked={account.langues_actives.includes(locale)}
                className="h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-foreground">{tLocales(locale)}</span>
            </label>
          ))}
          <button
            type="submit"
            className="mt-2 inline-flex cursor-pointer items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            {t("save")}
          </button>
        </form>
      </section>
    </div>
  );
}
