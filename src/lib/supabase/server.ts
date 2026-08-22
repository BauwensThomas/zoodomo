import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase côté serveur (Server Components/Actions), utilise la clé `anon` et respecte
 * RLS dans le contexte de l'utilisateur connecté (via son cookie de session Supabase Auth) :
 * à l'inverse du client `service_role` (`src/lib/supabase/admin.ts`), celui-ci ne voit que ce
 * que les policies RLS autorisent pour l'utilisateur courant.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component (lecture seule) : sans effet ici, la session
            // est de toute façon rafraîchie par `src/proxy.ts` à chaque requête.
          }
        },
      },
    }
  );
}
