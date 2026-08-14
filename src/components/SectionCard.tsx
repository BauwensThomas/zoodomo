export type SectionCardAccent = "indigo" | "purple" | "emerald" | "amber" | "pink" | "cyan" | "teal";

const ACCENT_CLASSES: Record<SectionCardAccent, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  purple: "bg-purple-50 text-purple-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  pink: "bg-pink-50 text-pink-600",
  cyan: "bg-cyan-50 text-cyan-600",
  teal: "bg-teal-50 text-teal-600",
};

export function SectionCard({
  icon: Icon,
  accent,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: SectionCardAccent;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-7">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACCENT_CLASSES[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-medium text-foreground">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-foreground">{hint}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
