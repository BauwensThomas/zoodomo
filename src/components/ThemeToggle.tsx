"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { setThemeAction } from "@/app/actions";

/**
 * Les deux icônes sont toujours rendues, l'affichage de l'une ou l'autre est tranché en CSS
 * pur (`.theme-toggle-sun`/`.theme-toggle-moon`, `src/app/globals.css`), avec le même
 * scoping que les tokens de couleur (`.app-theme-scope` + préférence système/`data-theme`) :
 * pas de `useState` qui devinerait l'état côté client, donc pas de flash ni d'incohérence à
 * l'hydratation. Le bouton affiche l'icône de la destination (soleil = "repasser en clair").
 */
export function ThemeToggle({ label }: { label: string }) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);

  function toggle() {
    const scope = buttonRef.current?.closest(".app-theme-scope");
    const explicit = scope?.getAttribute("data-theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const currentlyDark = explicit === "dark" || (explicit !== "light" && systemDark);
    const next = currentlyDark ? "light" : "dark";
    startTransition(async () => {
      await setThemeAction(next);
      router.refresh();
    });
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-opacity hover:opacity-80"
    >
      <Sun className="theme-toggle-sun h-4 w-4" />
      <Moon className="theme-toggle-moon h-4 w-4" />
    </button>
  );
}
