"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  Palette,
  UserCog,
  type LucideIcon,
} from "lucide-react";

export function EspaceNav() {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");

  const tabs: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/espace", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/espace/fiches", label: t("fiches"), icon: ListChecks },
    { href: "/espace/statistiques", label: t("statistiques"), icon: BarChart3 },
    { href: "/espace/personnalisation", label: t("personnalisation"), icon: Palette },
    { href: "/espace/compte", label: t("compte"), icon: UserCog },
  ];

  return (
    <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6">
      {tabs.map((tab) => {
        const active =
          tab.href === "/espace" ? pathname === "/espace" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
