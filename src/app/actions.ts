"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALES, type Locale } from "@/types";

export async function setLocaleAction(locale: Locale) {
  if (LOCALES.includes(locale)) {
    const store = await cookies();
    store.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    revalidatePath("/", "layout");
  }
}
