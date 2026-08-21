import { redirect } from "next/navigation";
import { ShieldCheck, LogOut } from "lucide-react";
import { isAdminSession } from "@/lib/mock/admin-auth";
import { adminLogoutAction } from "../actions";

// Page admin volontairement en français uniquement (équipe Zoodomo interne), pas de
// next-intl ici contrairement au reste de l'app.
export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminSession())) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-heading text-base font-medium">Administration Zoodomo</span>
          </div>
          <form action={adminLogoutAction}>
            <button
              type="submit"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-opacity hover:opacity-80"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
