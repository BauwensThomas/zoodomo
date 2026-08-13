"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listAccounts } from "@/lib/mock";
import { SESSION_COOKIE_NAME } from "@/lib/mock/auth";

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

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, account.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/espace");
}
