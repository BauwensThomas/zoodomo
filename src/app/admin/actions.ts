"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  listAccounts,
  sendAccountMessage,
  archiveSupportMessage,
  unarchiveSupportMessage,
  trashSupportMessage,
  restoreSupportMessageFromTrash,
  deleteSupportMessage,
  setSupportMessageRead,
} from "@/lib/mock";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { renderEmailHtml } from "@/lib/email/template";
import type { Locale } from "@/types";
import { isAdminSession } from "@/lib/mock/admin-auth";
import { isBlocked, recordFailedAttempt, resetAttempts } from "@/lib/mock/admin-login-attempts";

/** IP du visiteur depuis les headers de la requête (`x-forwarded-for` posé par le proxy/CDN
 * en production, ex. Vercel) ; repli sur une clé unique si absente (dev local direct). */
async function getClientKey(): Promise<string> {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || hdrs.get("x-real-ip") || "local";
}

export interface AdminLoginState {
  error?: string;
}

export async function adminLoginAction(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  // Page admin volontairement en français uniquement (équipe Zoodomo interne), pas de
  // next-intl ici contrairement au reste de l'app.
  const genericError = { error: "Email ou mot de passe incorrect." };

  const clientKey = await getClientKey();
  const blockedUntil = isBlocked(clientKey);
  if (blockedUntil) {
    const minutes = Math.max(1, Math.ceil((blockedUntil - Date.now()) / 60_000));
    return { error: `Trop de tentatives échouées. Réessayez dans ${minutes} minute(s).` };
  }

  // Le CAPTCHA Cloudflare Turnstile activé côté Supabase (Attack Protection) s'applique à
  // toute authentification par mot de passe, admin comprise, voir `src/app/login-actions.ts`.
  const captchaToken = String(formData.get("cf-turnstile-response") || "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });

  if (error || !data.user) {
    recordFailedAttempt(clientKey);
    if (error?.code === "captcha_failed") {
      return { error: "Vérification de sécurité échouée. Réessayez." };
    }
    return genericError;
  }

  // Un compte pro peut se connecter avec succès ici (même mécanisme d'authentification) sans
  // pour autant avoir accès à l'admin : vérifie l'appartenance à `admin_users` avant de laisser
  // passer, et referme la session sinon (jamais de session pro qui traîne sur `/admin`).
  const { data: adminRow } = await supabase.from("admin_users").select("id").eq("id", data.user.id).maybeSingle();
  if (!adminRow) {
    await supabase.auth.signOut();
    recordFailedAttempt(clientKey);
    return genericError;
  }

  resetAttempts(clientKey);
  redirect("/admin");
}

export async function adminLogoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export interface SavedState {
  saved: boolean;
  savedAt?: number;
}

const initialSaved: SavedState = { saved: false };

/** Chaque compte connaît désormais sa propre langue d'interface (`langue_interface`,
 * français par défaut tant qu'il n'a pas choisi) : `AdminBroadcastForm` ne propose donc
 * qu'un champ par langue réellement utilisée par au moins un compte ciblé, et chaque compte
 * reçoit ici son message dans sa seule langue, jamais dans toutes les langues du formulaire
 * à la fois, voir docs/DECISIONS.md. */
export async function sendAdminBroadcastAction(
  _prevState: SavedState,
  formData: FormData
): Promise<SavedState> {
  if (!(await isAdminSession())) redirect("/admin/login");

  const target = String(formData.get("target") || "tous");
  const get = (name: string) => String(formData.get(name) || "").trim();

  const admin = await createClient();
  const allAccounts = await listAccounts(admin);
  const accounts = target === "tous" ? allAccounts : allAccounts.filter((a) => a.id === target);

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";

  let sentAny = false;
  for (const account of accounts) {
    const locale = (account.langue_interface ?? "fr") as Locale;
    const subject = get(`subject_${locale}`);
    const body = get(`body_${locale}`);
    if (!subject || !body) continue;
    await sendAccountMessage(admin, { account_id: account.id, kind: "admin", subject, body });
    sentAny = true;

    const t = await getTranslations({ locale, namespace: "admin.messages" });
    await sendEmail({
      to: account.email,
      subject,
      html: renderEmailHtml({
        title: t("adminMessageEmailIntro"),
        body,
        buttonLabel: t("emailOpenButton"),
        buttonUrl: `${protocol}://${host}/espace/messages`,
      }),
    });
  }
  if (!sentAny) return initialSaved;

  // Ce formulaire vient d'un clic sur "Répondre" à un message "contacter le webmaster" :
  // une fois la réponse effectivement envoyée, ce message d'origine est considéré traité et
  // archivé automatiquement, voir docs/DECISIONS.md.
  const replyMessageId = get("replyMessageId");
  if (replyMessageId) await archiveSupportMessage(admin, replyMessageId);

  revalidatePath("/espace", "layout");
  revalidatePath("/admin");
  return { saved: true, savedAt: Date.now() };
}

export async function archiveSupportMessageAction(messageId: string) {
  if (!(await isAdminSession())) redirect("/admin/login");

  await archiveSupportMessage(await createClient(), messageId);
  revalidatePath("/admin");
}

export async function unarchiveSupportMessageAction(messageId: string) {
  if (!(await isAdminSession())) redirect("/admin/login");

  await unarchiveSupportMessage(await createClient(), messageId);
  revalidatePath("/admin");
}

export async function trashSupportMessageAction(messageId: string) {
  if (!(await isAdminSession())) redirect("/admin/login");

  await trashSupportMessage(await createClient(), messageId);
  revalidatePath("/admin");
}

export async function restoreSupportMessageAction(messageId: string) {
  if (!(await isAdminSession())) redirect("/admin/login");

  await restoreSupportMessageFromTrash(await createClient(), messageId);
  revalidatePath("/admin");
}

export async function deleteSupportMessageAction(messageId: string) {
  if (!(await isAdminSession())) redirect("/admin/login");

  await deleteSupportMessage(await createClient(), messageId);
  revalidatePath("/admin");
}

export async function setSupportMessageReadAction(messageId: string, read: boolean) {
  if (!(await isAdminSession())) redirect("/admin/login");

  await setSupportMessageRead(await createClient(), messageId, read);
  revalidatePath("/admin");
}
