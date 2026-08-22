"use server";

import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signupsEnabled } from "@/lib/signups";
import { slugify } from "@/lib/slugify";
import { isPasswordStrongEnough } from "@/lib/passwordStrength";
import type { Locale } from "@/types";

export interface SignupState {
  error?: string;
  submitted?: boolean;
  email?: string;
}

/** Même principe que `uniqueAccountSlug` de l'ancien store mocké (incrémente un suffixe tant
 * que le slug existe déjà), mais interrogé côté Supabase avec le client admin (avant que le
 * compte ait la moindre session pour passer par RLS). */
async function uniqueAccountSlug(admin: ReturnType<typeof createAdminClient>, base: string): Promise<string> {
  const root = slugify(base) || "compte";
  let slug = root;
  let i = 2;
  for (;;) {
    const { data } = await admin.from("accounts").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${root}-${i++}`;
  }
}

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  // Défense en profondeur : le formulaire est déjà masqué côté page quand les inscriptions
  // sont désactivées (`ZOODOMO_SIGNUPS_ENABLED=false`), mais l'action reste accessible
  // directement (form action, pas de JS). Voir docs/DECISIONS.md.
  if (!signupsEnabled()) {
    const t = await getTranslations("admin.signup");
    return { error: t("closedBody") };
  }

  const nom = String(formData.get("nom") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!nom || !email || !password) {
    const t = await getTranslations("admin.signup");
    return { error: t("error") };
  }

  // Déjà vérifié côté client (validation JS avant soumission, voir `InscriptionForm`), revérifié
  // ici en profondeur pour couvrir le cas où le formulaire serait soumis sans JavaScript.
  if (password !== confirmPassword) {
    const t = await getTranslations("admin.signup");
    return { error: t("passwordMismatchError") };
  }

  // Même principe : la checklist en direct (`PasswordRequirements.tsx`) et le blocage à la
  // soumission côté client ne dispensent pas d'une vérification côté serveur.
  if (!isPasswordStrongEnough(password)) {
    const t = await getTranslations("admin.signup");
    return { error: t("passwordTooWeak") };
  }

  // La langue déjà active sur cette page (choisie via le sélecteur, ou détectée depuis le
  // navigateur si le visiteur ne l'a pas changée) devient la langue d'interface initiale du
  // compte, plutôt que de repartir de zéro ("Automatique") : elle a été concrètement
  // observée à l'instant de l'inscription, voir docs/DECISIONS.md.
  const locale = (await getLocale()) as Locale;

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";

  // Jeton posé par le widget Cloudflare Turnstile (`TurnstileWidget.tsx`, champ caché
  // `cf-turnstile-response` créé par le widget lui-même à l'intérieur du `<form>`) : transmis
  // tel quel à Supabase Auth, qui vérifie lui-même sa validité (secret key configurée dans son
  // dashboard, jamais dans ce code), voir docs/DECISIONS.md.
  const captchaToken = String(formData.get("cf-turnstile-response") || "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${protocol}://${host}/auth/confirm`, captchaToken },
  });

  if (error || !data.user) {
    const t = await getTranslations("admin.signup");
    // `over_email_send_rate_limit` : limite d'envoi de Supabase Auth (bien plus basse tant
    // que le SMTP Resend n'est pas configuré dans ses réglages, voir docs/DECISIONS.md), pas
    // un problème côté compte : message distinct plutôt que le message générique trompeur.
    if (error?.code === "over_email_send_rate_limit") {
      return { error: t("rateLimited") };
    }
    // Jeton Turnstile manquant/invalide/expiré (widget pas encore chargé, JS désactivé, essai
    // resoumis trop tard : les jetons sont à usage unique).
    if (error?.code === "captcha_failed") {
      return { error: t("captchaFailed") };
    }
    if (error && error.code !== "user_already_exists") {
      console.error("[signupAction] Erreur Supabase Auth inattendue :", error);
    }
    return { error: t("error") };
  }

  // Ligne de profil créée via le client admin (service_role, contourne RLS) : à cet instant
  // le compte n'a pas encore de session (email non confirmé), donc pas de contexte
  // `auth.uid()` pour un insert respectant la policy normale. Voir
  // supabase/migrations/0003_accounts_auth.sql.
  const admin = createAdminClient();
  const slug = await uniqueAccountSlug(admin, nom);
  const { error: profileError } = await admin.from("accounts").insert({
    id: data.user.id,
    email,
    nom_affichage: nom,
    slug,
    contact_email_public: email,
    langue_interface: locale,
    langues_actives: [locale],
  });

  if (profileError) {
    // Évite un utilisateur Supabase Auth orphelin (créé mais sans ligne de profil, compte
    // inutilisable) si l'insert du profil échoue pour une raison quelconque.
    await admin.auth.admin.deleteUser(data.user.id);
    const t = await getTranslations("admin.signup");
    return { error: t("error") };
  }

  // Ligne `account_theme` par défaut (valeurs par défaut de la table), pour que Compte et
  // Personnalisation puissent faire un simple `.update()` dès le premier enregistrement au
  // lieu de devoir gérer un upsert (voir supabase/migrations/0005_full_data_rls.sql, qui a
  // aussi fait ce backfill pour les comptes déjà créés avant ce correctif).
  await admin.from("account_theme").insert({ account_id: data.user.id });

  // Compte non vérifié à la création : reste sur `/inscription`, bascule vers le panneau
  // d'attente de vérification sans navigation (demande utilisateur, même principe que "mot de
  // passe oublié" sur la page de connexion, voir docs/DECISIONS.md) plutôt que de rediriger
  // vers `/verification-email`. Cette page reste malgré tout nécessaire comme cible du
  // garde-fou de `src/app/espace/layout.tsx` (session existante mais email non confirmé).
  return { submitted: true, email };
}
