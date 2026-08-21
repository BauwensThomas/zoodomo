"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALES, type Locale } from "@/types";
import { getSessionAccount } from "@/lib/mock/auth";
import { updateAccountLangueInterface } from "@/lib/mock/store";

export async function setLocaleAction(locale: Locale) {
  if (LOCALES.includes(locale)) {
    const store = await cookies();
    store.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });

    // Si un pro est connecté quand il choisit sa langue, on la retient sur son compte (pas
    // seulement le cookie du navigateur), pour qu'elle le suive d'un appareil à l'autre,
    // voir DECISIONS.md.
    const account = await getSessionAccount();
    if (account) {
      updateAccountLangueInterface(account.id, locale);
    }

    revalidatePath("/", "layout");
  }
}
