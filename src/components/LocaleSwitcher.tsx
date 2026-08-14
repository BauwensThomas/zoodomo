"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { setLocaleAction } from "@/app/actions";
import { FlagIcon } from "@/components/FlagIcon";
import { LOCALES, type Locale } from "@/types";

interface LocaleSwitcherProps {
  current: Locale;
}

export function LocaleSwitcher({ current }: LocaleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t = useTranslations("locales");

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Toujours proposer les 3 langues de l'interface, quel que soit le nombre de langues
  // de contenu actives du compte visité : un visiteur doit pouvoir lire l'interface dans
  // sa langue même si le contenu (description, foyer idéal, présentation du compte)
  // n'existe que dans une seule langue, auquel cas la mention "disponible seulement en
  // ..." s'affiche à la place (voir pickLocalized/localesWithContent).
  const others = LOCALES.filter((locale) => locale !== current);

  function choose(locale: Locale) {
    setOpen(false);
    startTransition(async () => {
      await setLocaleAction(locale);
      router.refresh();
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t(current)}
        disabled={isPending}
        className="flex cursor-pointer items-center gap-1 rounded-full border border-border bg-white px-2 py-1.5 shadow-sm transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        <FlagIcon locale={current} className="h-4 w-4 rounded-full" />
        <ChevronDown
          className={`h-3.5 w-3.5 text-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 flex flex-col gap-1 rounded-xl border border-border bg-white p-1.5 shadow-md">
          {others.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => choose(locale)}
              aria-label={t(locale)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <FlagIcon locale={locale} className="h-4 w-4 rounded-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
