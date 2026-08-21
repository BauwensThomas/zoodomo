"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { listAccounts, createAccount } from "@/lib/mock";
import { SESSION_COOKIE_NAME } from "@/lib/mock/auth";
import type { Locale } from "@/types";

export interface SignupState {
  error?: string;
}

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const nom = String(formData.get("nom") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!nom || !email || !password) {
    const t = await getTranslations("admin.signup");
    return { error: t("error") };
  }

  const existing = listAccounts().find((a) => a.email.toLowerCase() === email);
  if (existing) {
    const t = await getTranslations("admin.signup");
    return { error: t("error") };
  }

  // La langue déjà active sur cette page (choisie via le sélecteur, ou détectée depuis le
  // navigateur si le visiteur ne l'a pas changée) devient la langue d'interface initiale du
  // compte, plutôt que de repartir de zéro ("Automatique") : elle a été concrètement
  // observée à l'instant de l'inscription, voir docs/DECISIONS.md.
  const locale = (await getLocale()) as Locale;
  const account = createAccount({ nom_affichage: nom, email, langue_interface: locale });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, account.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/espace");
}
