import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

/** Client Supabase "admin" : utilise la clé `service_role`, contourne RLS. Réservé au code
 * serveur (jamais importé depuis un composant `"use client"`) : migrations, scripts
 * ponctuels, ou opérations qui doivent délibérément ignorer les règles RLS. Les requêtes
 * "normales" (respectant RLS, dans le contexte de l'utilisateur connecté) utiliseront un
 * client séparé une fois l'authentification migrée vers Supabase Auth.
 *
 * `React.cache()` : renvoie la MÊME instance à chaque appel au sein d'une même requête
 * (layout + generateMetadata + page appellent chacun `createAdminClient()` séparément),
 * indispensable pour que le cache des fonctions de lecture ci-dessous
 * (`getAccountBySlug`/`getAccountTheme`, `src/lib/mock/helpers.ts`) puisse réellement
 * dédupliquer : `React.cache()` compare les arguments par référence, deux instances de
 * client différentes (même identiques fonctionnellement) ne seraient jamais reconnues comme
 * le même appel. Trouvé en creusant une vraie lenteur signalée par l'utilisateur (page compte
 * publique : 3 appels à `getAccountBySlug` et 2 à `getAccountTheme` par affichage), voir
 * docs/DECISIONS.md. */
export const createAdminClient = cache(function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
});
