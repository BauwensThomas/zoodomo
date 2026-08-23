"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALES, type Locale } from "@/types";
import { getSessionAccount } from "@/lib/mock/auth";
import { createClient } from "@/lib/supabase/server";
import { updateAccountLangueInterface, updateAccountThemePreference } from "@/lib/mock/store";

/** Même mécanique que `setLocaleAction` ci-dessous (cookie 1 an, `path: "/"`) : le cookie
 * reste la source pour les pages hors espace membre (admin, connexion, pages légales) ; si un
 * pro est connecté (espace membre), son choix est en plus enregistré sur son compte pour le
 * suivre d'un appareil à l'autre, voir `src/app/espace/layout.tsx`, DECISIONS.md. */
export async function setThemeAction(theme: "light" | "dark") {
  const store = await cookies();
  store.set("THEME_PREFERENCE", theme, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  const account = await getSessionAccount();
  if (account) {
    const supabase = await createClient();
    await updateAccountThemePreference(supabase, account.id, theme);
  }

  revalidatePath("/", "layout");
}

export async function setLocaleAction(locale: Locale) {
  if (LOCALES.includes(locale)) {
    const store = await cookies();
    store.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });

    // Si un pro est connecté quand il choisit sa langue, on la retient sur son compte (pas
    // seulement le cookie du navigateur), pour qu'elle le suive d'un appareil à l'autre,
    // voir DECISIONS.md.
    const account = await getSessionAccount();
    if (account) {
      const supabase = await createClient();
      await updateAccountLangueInterface(supabase, account.id, locale);
    }

    revalidatePath("/", "layout");
  }
}
