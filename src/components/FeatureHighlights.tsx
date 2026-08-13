import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function FeatureHighlights() {
  const t = useTranslations("admin.login");

  const items = [
    t("featurePersonalize"),
    t("featureLanguages"),
    t("featureShare"),
    t("featureReminders"),
  ];

  return (
    <div>
      <p className="font-heading text-lg font-medium text-foreground">{t("whyTitle")}</p>
      <ul className="mt-4 space-y-3">
        {items.map((label) => (
          <li key={label} className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2f6b4f]" />
            <span className="text-sm font-medium text-foreground">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
