import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LOCALES, type Locale } from "@/types";

/**
 * Callback appelé par le lien envoyé par Supabase Auth : confirmation d'inscription
 * (`emailRedirectTo` dans `signUp`/`resend`, voir `src/app/signup-actions.ts`) et
 * réinitialisation de mot de passe (`resetPasswordForEmail`, voir
 * `src/app/mot-de-passe-oublie/actions.ts`) partagent ce même callback, distingués par `type`.
 * Remplace l'ancienne page `/verifier-email` (jeton maison), voir docs/DECISIONS.md.
 */

/**
 * Pose le cookie `NEXT_LOCALE` (même mécanisme que `setLocaleAction`, `src/app/actions.ts`)
 * quand le lien cliqué porte un `&locale=fr|nl|en` : les templates d'email trilingues
 * empilés (fr/nl/en) ont chacun leur propre bouton avec ce paramètre, pour que la page
 * ouverte suive la section du mail sur laquelle le destinataire a cliqué plutôt que de
 * dépendre uniquement de la langue du navigateur. Voir docs/DECISIONS.md.
 */
function applyLocaleFromLink(response: NextResponse, searchParams: URLSearchParams) {
  const locale = searchParams.get("locale");
  if (LOCALES.includes(locale as Locale)) {
    response.cookies.set("NEXT_LOCALE", locale as Locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      if (type === "recovery") {
        // La session posée par `verifyOtp` sert ici à choisir un nouveau mot de passe, pas à
        // accéder au tableau de bord directement.
        return applyLocaleFromLink(
          NextResponse.redirect(new URL("/reinitialiser-mot-de-passe", request.url)),
          searchParams
        );
      }
      // Confirmation d'inscription (ou autre type) : email confirmé, mais on ne dépend pas de
      // la session posée par `verifyOtp` pour ouvrir directement le tableau de bord (demande
      // utilisateur : plus simple et plus robuste de faire retaper le mot de passe, voir
      // docs/DECISIONS.md). Déconnexion explicite, retour à la connexion avec l'email prérempli.
      const email = data.user?.email ?? "";
      await supabase.auth.signOut();
      return applyLocaleFromLink(
        NextResponse.redirect(new URL(`/?email=${encodeURIComponent(email)}&confirme=1`, request.url)),
        searchParams
      );
    }
  }

  const erreurDestination = type === "recovery" ? "/mot-de-passe-oublie" : "/";
  return applyLocaleFromLink(
    NextResponse.redirect(new URL(`${erreurDestination}?erreur=lien_invalide`, request.url)),
    searchParams
  );
}
