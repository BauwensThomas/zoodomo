"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { listAccounts, updateAccountLangueInterface } from "@/lib/mock";
import { SESSION_COOKIE_NAME } from "@/lib/mock/auth";
import type { Locale } from "@/types";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  const account = listAccounts().find((a) => a.email.toLowerCase() === email);
  if (!account || !password) {
    const t = await getTranslations("admin.login");
    return { error: t("error") };
  }

  // Un compte plus ancien qui n'a encore jamais choisi de langue (via l'inscription ou le
  // tableau de bord) part de la langue déjà active sur cette page de connexion, plutôt que
  // de rester "Automatique" jusqu'à un premier passage par le sélecteur du dashboard, voir
  // docs/DECISIONS.md. Un compte qui a déjà une préférence n'est jamais réécrit ici, pour ne
  // pas l'écraser par la langue détectée sur CET appareil de connexion précis.
  if (!account.langue_interface) {
    const locale = (await getLocale()) as Locale;
    updateAccountLangueInterface(account.id, locale);
  }

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, account.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/espace");
}
