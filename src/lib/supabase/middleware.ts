import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rafraîchit le cookie de session Supabase Auth à chaque requête (appelé depuis
 * `src/proxy.ts`, l'équivalent Next.js 16 de `middleware.ts`, voir docs/DECISIONS.md).
 * Nécessaire avec `@supabase/ssr` : sans ça, un token expiré ne serait jamais renouvelé
 * automatiquement côté serveur.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Force la lecture/le rafraîchissement du token, pas juste la présence du cookie.
  await supabase.auth.getUser();

  return response;
}
