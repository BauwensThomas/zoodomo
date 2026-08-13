import type { Locale } from "@/types";

const LABELS: Record<Locale, string> = {
  fr: "Français",
  nl: "Nederlands",
  en: "English",
};

export function FlagIcon({ locale, className }: { locale: Locale; className?: string }) {
  if (locale === "fr") {
    return (
      <svg viewBox="0 0 3 2" role="img" aria-label={LABELS.fr} className={className}>
        <rect width="1" height="2" x="0" fill="#0055A4" />
        <rect width="1" height="2" x="1" fill="#FFFFFF" />
        <rect width="1" height="2" x="2" fill="#EF4135" />
      </svg>
    );
  }

  if (locale === "nl") {
    return (
      <svg viewBox="0 0 3 2" role="img" aria-label={LABELS.nl} className={className}>
        <rect width="3" height="0.667" y="0" fill="#AE1C28" />
        <rect width="3" height="0.667" y="0.667" fill="#FFFFFF" />
        <rect width="3" height="0.667" y="1.334" fill="#21468B" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 60 30" role="img" aria-label={LABELS.en} className={className}>
      <rect width="60" height="30" fill="#00247d" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 60,30 M60,0 0,30" stroke="#cf142b" strokeWidth="2" />
      <path d="M30,0 30,30 M0,15 60,15" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 30,30 M0,15 60,15" stroke="#cf142b" strokeWidth="6" />
    </svg>
  );
}
