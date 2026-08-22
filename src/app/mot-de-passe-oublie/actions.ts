"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export interface RequestResetState {
  submitted: boolean;
  error?: string;
}

/**
 * Toujours le même résultat, que l'email corresponde ou non à un compte : ne jamais révéler
 * si une adresse existe (protection contre l'énumération d'emails). `resetPasswordForEmail`
 * de Supabase suit déjà ce principe de son côté (pas d'erreur distincte si l'email n'existe
 * pas), on ne fait ici que ne jamais montrer autre chose qu'un message générique.
 * Exception volontaire : un échec du CAPTCHA (jeton manquant/invalide/expiré) est bien signalé,
 * ce n'est pas une information sur l'existence du compte, juste un aléa technique à corriger
 * en réessayant.
 */
export async function requestPasswordResetAction(
  _prevState: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const captchaToken = String(formData.get("cf-turnstile-response") || "");
  if (!email) return { submitted: false };

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";

  // Supabase ajoute lui-même `token_hash`/`type=recovery` à cette URL dans le lien de l'email
  // (même mécanisme que `emailRedirectTo` pour l'inscription, voir signup-actions.ts) : pas
  // besoin de les poser à la main ici.
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${protocol}://${host}/auth/confirm`,
    captchaToken,
  });

  if (error?.code === "captcha_failed") {
    const t = await getTranslations("admin.forgotPassword");
    return { submitted: false, error: t("captchaFailed") };
  }

  return { submitted: true };
}
