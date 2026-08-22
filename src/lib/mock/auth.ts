import { createClient } from "@/lib/supabase/server";
import type { Account } from "@/types";

/**
 * Compte du pro connecté, résolu depuis la session Supabase Auth (cookie géré par
 * `@supabase/ssr`, rafraîchi à chaque requête par `src/proxy.ts`), plus sa ligne de profil
 * dans `public.accounts` (RLS : un compte ne peut lire que sa propre ligne, voir
 * `supabase/migrations/0003_accounts_auth.sql`). Remplace l'ancien cookie de session maison
 * (`zoodomo_session`) le 2026-08-22, voir docs/DECISIONS.md. Signature/emplacement conservés
 * tels quels (toujours dans `lib/mock/`, même si plus rien de mocké ici) pour ne pas casser
 * les nombreux appelants existants.
 */
export async function getSessionAccount(): Promise<Account | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: account } = await supabase.from("accounts").select("*").eq("id", user.id).single();
  return (account as Account) ?? null;
}

/** `true` une fois le lien de confirmation envoyé par Supabase Auth cliqué (statut natif
 * `auth.users.email_confirmed_at`, plus de champ `email_verifie` maison sur `accounts`
 * depuis le 2026-08-22). */
export async function isSessionEmailConfirmed(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user?.email_confirmed_at);
}
