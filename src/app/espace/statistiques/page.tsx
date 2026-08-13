import { getTranslations } from "next-intl/server";
import { BarChart3 } from "lucide-react";

export default async function StatistiquesPage() {
  const t = await getTranslations("admin.stats");

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("title")}
      </h1>
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/60 p-12 text-center">
        <BarChart3 className="h-8 w-8 text-foreground/30" />
        <p className="text-foreground/60">{t("text1")}</p>
        <p className="text-sm text-foreground/40">{t("text2")}</p>
      </div>
    </div>
  );
}
