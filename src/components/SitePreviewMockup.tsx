import Image from "next/image";
import { PawPrint } from "lucide-react";
import { useTranslations } from "next-intl";

export function SitePreviewMockup() {
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const tForm = useTranslations("admin.form");

  // Photos réelles (licence Unsplash, gratuite, sans attribution requise pour un usage
  // commercial), une seule espèce cohérente avec l'URL affichée dans la barre du mockup
  // ("/chiens"), voir docs/DECISIONS.md. `statut` pilote le même bandeau diagonal que sur les
  // vraies pages publiques (`src/app/[compte]/[espece]/page.tsx`, `AnimalPhotoBox`), traduit
  // via le même namespace `status`.
  const cards = [
    {
      photo: "/mock/preview/dog-1.jpg",
      badge: tForm("badgeSenior"),
      name: "Rex",
      statut: "adopte" as const,
    },
    {
      photo: "/mock/preview/dog-2.jpg",
      badge: null,
      name: "Luna",
      statut: "disponible" as const,
    },
    {
      photo: "/mock/preview/dog-3.jpg",
      badge: tForm("badgeSos"),
      name: "Fifi",
      statut: "reserve" as const,
    },
    {
      photo: "/mock/preview/dog-4.jpg",
      badge: null,
      name: "Milo",
      statut: "disponible" as const,
    },
  ];

  return (
    <div className="preview-always-light w-full overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
      <div className="flex items-center gap-2 border-b border-border bg-neutral-50 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-neutral-300" />
        <span className="h-2 w-2 rounded-full bg-neutral-300" />
        <span className="h-2 w-2 rounded-full bg-neutral-300" />
        <span className="ml-2 rounded-md bg-white px-2.5 py-0.5 text-xs text-foreground shadow-sm">
          zoodomo.com/refuge-x/chiens
        </span>
        <span className="text-[10px] italic text-neutral-400">{tCommon("previewLabel")}</span>
      </div>

      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2f6b4f] text-white">
            <PawPrint className="h-2.5 w-2.5" />
          </span>
          <span className="text-xs font-medium text-foreground">Refuge des Quatre Pattes</span>
        </div>
        <span className="rounded-full border border-[#2f6b4f]/40 px-2 py-0.5 text-[10px] font-medium text-[#2f6b4f]">
          {tCommon("backToSite")}
        </span>
      </div>

      <div className="flex justify-center gap-4 p-2">
        {cards.map((card) => (
          <div key={card.name} className="w-32 shrink-0 overflow-hidden rounded-lg border border-border">
            <div className="relative h-20 w-32">
              <Image
                src={card.photo}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
              {card.badge && (
                <span className="absolute left-1 top-1 rounded-full bg-[#2f6b4f] px-1.5 py-0.5 text-[8px] font-medium text-white">
                  {card.badge}
                </span>
              )}
              {card.statut !== "disponible" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden bg-black/10">
                  <span
                    className={`-rotate-6 rounded px-3 py-1 text-sm font-bold uppercase tracking-wide text-white shadow-lg ${
                      card.statut === "reserve" ? "bg-amber-500" : "bg-rose-500"
                    }`}
                  >
                    {tStatus(card.statut)}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-0.5 p-1.5">
              <p className="truncate text-xs font-medium text-foreground">{card.name}</p>
              <p className="truncate text-[10px] text-foreground">{tStatus(card.statut)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
