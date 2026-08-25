"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Users, Images, Star, type LucideIcon } from "lucide-react";

// Page admin volontairement en français uniquement (équipe Zoodomo interne), pas de
// next-intl ici contrairement au reste de l'app, voir `EspaceNav.tsx` pour l'équivalent
// espace membre dont ce composant reprend le même patron (onglets = vraies routes,
// `usePathname()` pour l'état actif).
export function AdminNav({ unreadMessages }: { unreadMessages: number }) {
  const pathname = usePathname();

  const tabs: { href: string; label: string; icon: LucideIcon; badge?: number }[] = [
    { href: "/admin", label: "Messages", icon: Inbox, badge: unreadMessages },
    { href: "/admin/clients", label: "Clients", icon: Users },
    { href: "/admin/photos", label: "Photos", icon: Images },
    { href: "/admin/votes", label: "Votes", icon: Star },
  ];

  return (
    <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6">
      {tabs.map((tab) => {
        const active = tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "border-foreground text-foreground" : "border-transparent text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {!!tab.badge && (
              <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
