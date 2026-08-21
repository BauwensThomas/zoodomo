import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE_NAME = "zoodomo_admin_session";

/**
 * Rôle admin Zoodomo séparé des comptes clients : identifiants en variables d'environnement
 * (`ZOODOMO_ADMIN_EMAIL`/`ZOODOMO_ADMIN_PASSWORD`, jamais dans le code), comparaison en temps
 * constant (voir `src/app/admin/actions.ts`). Reste un stopgap de la phase mockée : à
 * remplacer par un vrai rôle admin Supabase (table dédiée ou claim JWT) + RLS, voir
 * `docs/BRIEF-COMPLET-SAAS-ANIMAUX.md` section 9.
 */
export async function isAdminSession() {
  const store = await cookies();
  return store.get(ADMIN_SESSION_COOKIE_NAME)?.value === "true";
}
