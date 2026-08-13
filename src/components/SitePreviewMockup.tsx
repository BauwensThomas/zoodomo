import { Cat, Dog, PawPrint } from "lucide-react";
import { useTranslations } from "next-intl";

export function SitePreviewMockup() {
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const tForm = useTranslations("admin.form");

  const cards = [
    {
      from: "#f3c98b",
      to: "#e19a4e",
      badge: tForm("badgeSenior"),
      icon: Dog,
      name: "Rex",
      status: tStatus("disponible"),
    },
    {
      from: "#a9c9b4",
      to: "#6f9d80",
      badge: null,
      icon: Cat,
      name: "Luna",
      status: tStatus("disponible"),
    },
    {
      from: "#e3b3ae",
      to: "#c97b73",
      badge: tForm("badgeSos"),
      icon: Cat,
      name: "Fifi",
      status: tStatus("reserve"),
    },
  ];

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
      <div className="flex items-center gap-2 border-b border-border bg-neutral-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
        <span className="ml-2 rounded-md bg-white px-3 py-1 text-xs text-foreground/70 shadow-sm">
          zoodomo.com/refuge-x/chiens
        </span>
      </div>

      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2f6b4f] text-white">
            <PawPrint className="h-3 w-3" />
          </span>
          <span className="text-sm font-medium text-foreground">Refuge des Quatre Pattes</span>
        </div>
        <span className="rounded-full border border-[#2f6b4f]/40 px-2.5 py-1 text-[10px] font-medium text-[#2f6b4f]">
          {tCommon("backToSite")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 p-5">
        {cards.map((card) => (
          <div key={card.name} className="overflow-hidden rounded-lg border border-border">
            <div
              className="relative flex h-24 items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${card.from}, ${card.to})`,
              }}
            >
              <card.icon className="h-6 w-6 text-white/90" strokeWidth={1.5} />
              {card.badge && (
                <span className="absolute left-1 top-1 rounded-full bg-[#2f6b4f] px-1.5 py-0.5 text-[8px] font-medium text-white">
                  {card.badge}
                </span>
              )}
            </div>
            <div className="space-y-0.5 p-1.5">
              <p className="truncate text-xs font-medium text-foreground">{card.name}</p>
              <p className="truncate text-[10px] text-foreground/70">{card.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
