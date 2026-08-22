"use server";

import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  if (!email || !password) {
    const t = await getTranslations("admin.login");
    return { error: t("error") };
  }

  // Le CAPTCHA Cloudflare Turnstile activé côté Supabase (Attack Protection) s'applique en
  // réalité à toute requête d'authentification par mot de passe (connexion comprise), pas
  // seulement à l'inscription/la réinitialisation comme prévu initialement : sans jeton ici,
  // `signInWithPassword` échoue systématiquement (`captcha protection: request disallowed`),
  // découvert en testant réellement la connexion après avoir activé cette protection. Voir
  // docs/DECISIONS.md.
  const captchaToken = String(formData.get("cf-turnstile-response") || "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });

  if (error || !data.user) {
    const t = await getTranslations("admin.login");
    if (error?.code === "captcha_failed") return { error: t("captchaFailed") };
    return { error: t("error") };
  }

  // Un compte plus ancien qui n'a encore jamais choisi de langue (via l'inscription ou le
  // tableau de bord) part de la langue déjà active sur cette page de connexion, plutôt que
  // de rester "Automatique" jusqu'à un premier passage par le sélecteur du dashboard, voir
  // docs/DECISIONS.md. Un compte qui a déjà une préférence n'est jamais réécrit ici, pour ne
  // pas l'écraser par la langue détectée sur CET appareil de connexion précis. Client admin
  // (service_role) : la session vient tout juste d'être posée, plus simple que de dépendre
  // du timing exact de propagation du cookie dans ce même Server Action.
  const admin = createAdminClient();
  const { data: account } = await admin
    .from("accounts")
    .select("langue_interface")
    .eq("id", data.user.id)
    .single();
  if (account && !account.langue_interface) {
    const locale = (await getLocale()) as Locale;
    await admin.from("accounts").update({ langue_interface: locale }).eq("id", data.user.id);
  }

  redirect("/espace");
}
