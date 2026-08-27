"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LOCALES, type Locale } from "@/types";

export interface LoginState {
  error?: string;
  // Distingue un échec du CAPTCHA (aucune information sur la validité du mot de passe, le
  // lien "Mot de passe oublié" n'a pas de sens dans ce cas précis) d'un vrai échec
  // d'authentification. Voir `LoginForm.tsx` et docs/DECISIONS.md.
  isCaptchaError?: boolean;
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
    if (error?.code === "captcha_failed")
      return { error: t("captchaFailed"), isCaptchaError: true };
    return { error: t("error") };
  }

  // Un compte plus ancien qui n'a encore jamais choisi de langue (via l'inscription ou le
  // tableau de bord) part de la langue déjà active sur cette page de connexion, plutôt que
  // de rester "Automatique" jusqu'à un premier passage par le sélecteur du dashboard, voir
  // docs/DECISIONS.md. Client admin (service_role) : la session vient tout juste d'être
  // posée, plus simple que de dépendre du timing exact de propagation du cookie dans ce même
  // Server Action.
  const admin = createAdminClient();
  const { data: account } = await admin
    .from("accounts")
    .select("langue_interface, theme_preference")
    .eq("id", data.user.id)
    .single();
  if (account && !account.langue_interface) {
    const locale = (await getLocale()) as Locale;
    await admin.from("accounts").update({ langue_interface: locale }).eq("id", data.user.id);
  }

  // Le dernier choix explicite avant connexion l'emporte, même principe que pour le thème
  // ci-dessous : si la page de connexion affichait français juste avant de se connecter
  // (cookie `NEXT_LOCALE` posé par le sélecteur de langue), ce choix doit gagner sur une
  // préférence différente déjà enregistrée en base, pas l'inverse. Remplace l'ancien
  // comportement ("la langue ne s'écrit qu'une fois, jamais réécrite ensuite") : décision
  // utilisateur du 2026-08-25, bug réel signalé (page de connexion en français, dashboard
  // ouvert en néerlandais juste après connexion). Voir docs/DECISIONS.md.
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  if (
    LOCALES.includes(cookieLocale as Locale) &&
    account &&
    account.langue_interface !== cookieLocale
  ) {
    await admin.from("accounts").update({ langue_interface: cookieLocale }).eq("id", data.user.id);
  }

  // Contrairement à la langue (qui ne s'écrit qu'une fois, jamais réécrite ensuite pour ne
  // pas effacer une préférence déjà choisie ailleurs), le thème suit le dernier bascule
  // explicite : si le compte a basculé clair/sombre juste avant de se connecter (bouton sur
  // cette page, cookie posé mais compte pas encore rattaché puisque pas encore connecté), ce
  // choix doit gagner sur une préférence différente déjà enregistrée en base, pas l'inverse.
  // Décision utilisateur (2026-08-24), voir docs/DECISIONS.md.
  const cookieTheme = (await cookies()).get("THEME_PREFERENCE")?.value;
  if (
    (cookieTheme === "light" || cookieTheme === "dark") &&
    account &&
    account.theme_preference !== cookieTheme
  ) {
    await admin.from("accounts").update({ theme_preference: cookieTheme }).eq("id", data.user.id);
  }

  redirect("/espace");
}
