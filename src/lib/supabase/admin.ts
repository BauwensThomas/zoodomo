import { createClient } from "@supabase/supabase-js";

/** Client Supabase "admin" : utilise la clé `service_role`, contourne RLS. Réservé au code
 * serveur (jamais importé depuis un composant `"use client"`) : migrations, scripts
 * ponctuels, ou opérations qui doivent délibérément ignorer les règles RLS. Les requêtes
 * "normales" (respectant RLS, dans le contexte de l'utilisateur connecté) utiliseront un
 * client séparé une fois l'authentification migrée vers Supabase Auth. */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
