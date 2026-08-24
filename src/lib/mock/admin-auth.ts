import { createClient } from "@/lib/supabase/server";

/**
 * Rôle admin Zoodomo : un utilisateur `auth.users` normal (même mécanisme de connexion que
 * les comptes pro, voir `src/app/admin/actions.ts`) qui a en plus une ligne dans la table
 * `admin_users` (`supabase/migrations/0016_admin_role.sql`). Séparé des comptes clients : un
 * admin n'a pas de ligne dans `accounts`, un pro n'a pas de ligne dans `admin_users`.
 */
export async function isAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.from("admin_users").select("id").eq("id", user.id).maybeSingle();
  return Boolean(data);
}
