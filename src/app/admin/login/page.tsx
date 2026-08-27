import { cookies } from "next/headers";
import { AdminLoginForm } from "./AdminLoginForm";
import type { Metadata } from "next";

// Admin privé : jamais indexé ni exploré (exigence utilisateur explicite, 2026-08-27), en
// plus du `Disallow` déjà posé dans `src/app/robots.ts`. Cette page vit hors du groupe
// `(protected)`, `metadata` posé ici séparément plutôt que sur un layout partagé inexistant.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Page admin volontairement en français uniquement (équipe Zoodomo interne), pas de
// next-intl ici contrairement au reste de l'app. Composant serveur (pour lire le cookie de
// thème avant le premier rendu, sans flash) qui délègue le formulaire lui-même à
// `AdminLoginForm` (client, état local pour afficher/masquer le mot de passe).
export default async function AdminLoginPage() {
  const theme = (await cookies()).get("THEME_PREFERENCE")?.value;

  return (
    <div
      className="app-theme-scope flex min-h-screen items-center justify-center bg-background px-6"
      data-theme={theme === "light" ? "light" : theme === "dark" ? "dark" : undefined}
    >
      <AdminLoginForm />
    </div>
  );
}
