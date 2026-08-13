"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listAccounts, createAccount } from "@/lib/mock";
import { SESSION_COOKIE_NAME } from "@/lib/mock/auth";

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

  const account = createAccount({ nom_affichage: nom, email });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, account.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/espace");
}
