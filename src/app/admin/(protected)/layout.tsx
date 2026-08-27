import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck, LogOut } from "lucide-react";
import { isAdminSession } from "@/lib/mock/admin-auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import { countUnreadSupportMessages } from "@/lib/mock";
import { adminLogoutAction } from "../actions";
import { AdminNav } from "./AdminNav";
import type { Metadata } from "next";

// Admin privé : jamais indexé ni exploré (exigence utilisateur explicite, 2026-08-27), en
// plus du `Disallow` déjà posé dans `src/app/robots.ts`.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Page admin volontairement en français uniquement (équipe Zoodomo interne), pas de
// next-intl ici contrairement au reste de l'app.
export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminSession())) redirect("/admin/login");

  const theme = (await cookies()).get("THEME_PREFERENCE")?.value;
  const unreadMessages = await countUnreadSupportMessages(await createClient());

  return (
    <div
      className="app-theme-scope min-h-screen bg-background"
      data-theme={theme === "light" ? "light" : theme === "dark" ? "dark" : undefined}
    >
      <div className="sticky top-0 z-10 bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-heading text-base font-medium">Administration Zoodomo</span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle label="Changer de thème" />
              <form action={adminLogoutAction}>
                <button
                  type="submit"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-opacity hover:opacity-80"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </header>
        <div className="border-b border-border">
          <AdminNav unreadMessages={unreadMessages} />
        </div>
      </div>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
