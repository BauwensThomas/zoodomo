import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALES, type Locale } from "@/types";

const DEFAULT_LOCALE: Locale = "fr";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = LOCALES.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
