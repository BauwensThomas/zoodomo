"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { isPasswordStrongEnough } from "@/lib/passwordStrength";

export interface UpdatePasswordState {
  error?: string;
}

export async function updatePasswordAction(
  _prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  const t = await getTranslations("admin.resetPassword");

  if (!password) return { error: t("error") };
  // Déjà vérifié côté client, revérifié ici en profondeur (même principe que l'inscription,
  // voir signup-actions.ts), pour couvrir le cas d'une soumission sans JavaScript.
  if (!isPasswordStrongEnough(password)) return { error: t("passwordTooWeak") };
  if (password !== confirmPassword) return { error: t("passwordMismatchError") };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // `error.code` distingue les cas où Supabase Auth lui-même refuse le mot de passe
    // (message générique sinon inexploitable pour l'utilisateur, voir docs/DECISIONS.md).
    if (error.code === "same_password") return { error: t("samePassword") };
    if (error.code === "weak_password") return { error: t("weakPassword") };
    console.error("[updatePasswordAction] Erreur Supabase Auth inattendue :", error.code, error.message);
    return { error: t("error") };
  }

  redirect("/espace");
}
