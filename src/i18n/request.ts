import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { LOCALES, type Locale } from "@/types";
import { getSessionAccount } from "@/lib/mock/auth";

const DEFAULT_LOCALE: Locale = "fr";

/**
 * Tant qu'aucun choix explicite n'a été fait (pas de cookie NEXT_LOCALE, posé par le
 * sélecteur de langue), on retombe sur la langue du navigateur plutôt que sur le français
 * en dur : on lit `Accept-Language` par ordre de préférence (poids `q`) et on garde la
 * première langue qui correspond à l'une des 3 langues supportées.
 */
function localeFromAcceptLanguage(acceptLanguage: string | null): Locale | null {
  if (!acceptLanguage) return null;

  const preferences = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, qValue] = part.trim().split(";q=");
      return { tag: tag.trim().toLowerCase(), quality: qValue ? parseFloat(qValue) : 1 };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of preferences) {
    const primary = tag.split("-")[0];
    if (LOCALES.includes(primary as Locale)) return primary as Locale;
  }
  return null;
}

export default getRequestConfig(async () => {
  // Priorité 1 : préférence enregistrée sur le compte du pro connecté, pour le suivre
  // d'un appareil à l'autre plutôt que de dépendre du cookie/navigateur de l'appareil
  // courant, voir DECISIONS.md.
  const account = await getSessionAccount();
  const accountLocale = account?.langue_interface;

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  let locale: Locale;
  if (LOCALES.includes(accountLocale as Locale)) {
    locale = accountLocale as Locale;
  } else if (LOCALES.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else {
    const headerStore = await headers();
    locale = localeFromAcceptLanguage(headerStore.get("accept-language")) ?? DEFAULT_LOCALE;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
