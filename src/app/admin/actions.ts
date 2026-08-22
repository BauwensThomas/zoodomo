"use server";

import { timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
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
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_SESSION_COOKIE_NAME, isAdminSession } from "@/lib/mock/admin-auth";
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

/** Comparaison en temps constant : évite qu'un attaquant déduise le mot de passe correct
 * en mesurant le temps de réponse (les fuites de longueur restent possibles, acceptable
 * pour ce stopgap de phase mockée, voir `src/lib/mock/admin-auth.ts`). */
function safeCompare(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function adminLoginAction(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const clientKey = await getClientKey();
  const blockedUntil = isBlocked(clientKey);
  if (blockedUntil) {
    const minutes = Math.max(1, Math.ceil((blockedUntil - Date.now()) / 60_000));
    return { error: `Trop de tentatives échouées. Réessayez dans ${minutes} minute(s).` };
  }

  const expectedEmail = (process.env.ZOODOMO_ADMIN_EMAIL || "").trim().toLowerCase();
  const expectedPassword = process.env.ZOODOMO_ADMIN_PASSWORD || "";

  if (
    !expectedEmail ||
    !expectedPassword ||
    email !== expectedEmail ||
    !safeCompare(password, expectedPassword)
  ) {
    recordFailedAttempt(clientKey);
    // Page admin volontairement en français uniquement (équipe Zoodomo interne),
    // pas de next-intl ici contrairement au reste de l'app.
    return { error: "Email ou mot de passe incorrect." };
  }

  resetAttempts(clientKey);
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE_NAME, "true", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/admin");
}

export async function adminLogoutAction() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE_NAME);
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

  const admin = createAdminClient();
  const allAccounts = await listAccounts(admin);
  const accounts = target === "tous" ? allAccounts : allAccounts.filter((a) => a.id === target);

  let sentAny = false;
  for (const account of accounts) {
    const locale = account.langue_interface ?? "fr";
    const subject = get(`subject_${locale}`);
    const body = get(`body_${locale}`);
    if (!subject || !body) continue;
    await sendAccountMessage(admin, { account_id: account.id, kind: "admin", subject, body });
    sentAny = true;
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

  await archiveSupportMessage(createAdminClient(), messageId);
  revalidatePath("/admin");
}

export async function unarchiveSupportMessageAction(messageId: string) {
  if (!(await isAdminSession())) redirect("/admin/login");

  await unarchiveSupportMessage(createAdminClient(), messageId);
  revalidatePath("/admin");
}

export async function trashSupportMessageAction(messageId: string) {
  if (!(await isAdminSession())) redirect("/admin/login");

  await trashSupportMessage(createAdminClient(), messageId);
  revalidatePath("/admin");
}

export async function restoreSupportMessageAction(messageId: string) {
  if (!(await isAdminSession())) redirect("/admin/login");

  await restoreSupportMessageFromTrash(createAdminClient(), messageId);
  revalidatePath("/admin");
}

export async function deleteSupportMessageAction(messageId: string) {
  if (!(await isAdminSession())) redirect("/admin/login");

  await deleteSupportMessage(createAdminClient(), messageId);
  revalidatePath("/admin");
}

export async function setSupportMessageReadAction(messageId: string, read: boolean) {
  if (!(await isAdminSession())) redirect("/admin/login");

  await setSupportMessageRead(createAdminClient(), messageId, read);
  revalidatePath("/admin");
}
