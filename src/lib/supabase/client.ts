import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase côté navigateur, utilise la clé `anon` et respecte RLS dans le contexte de
 * l'utilisateur connecté (session lue depuis les cookies gérés par `@supabase/ssr`, les mêmes
 * que le client serveur, `server.ts`). Première exception au principe "tout passe par le
 * serveur" suivi jusqu'ici dans ce projet : réservé à l'upload direct de photos vers Supabase
 * Storage depuis `PhotoUploadField.tsx` (RLS sur `storage.objects`, voir
 * `supabase/migrations/0009_photos_storage_bucket.sql`, est la bonne frontière de confiance
 * pour un utilisateur qui uploade son propre fichier, pas besoin de repasser par le serveur).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
