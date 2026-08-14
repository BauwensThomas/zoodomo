import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { getSessionAccount } from "@/lib/mock/auth";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import { EspaceNav } from "./EspaceNav";
import { logoutAction } from "./actions";
import type { Locale } from "@/types";

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("admin");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-white">
        <div className="mx-auto grid max-w-[100rem] grid-cols-3 items-center px-6 py-3">
          <Link href="/espace" className="justify-self-start">
            <ZoodomoLogo width={120} />
          </Link>
          <span className="justify-self-center text-sm font-medium text-foreground">
            {account.nom_affichage}
          </span>
          <div className="flex items-center gap-3 justify-self-end">
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-opacity hover:opacity-80"
              >
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </button>
            </form>
            <LocaleSwitcher current={locale} />
          </div>
        </div>
        <EspaceNav />
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-[100rem] px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
