import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionAccount } from "@/lib/mock/auth";
import { createClient } from "@/lib/supabase/server";
import { getAccountTheme } from "@/lib/mock";
import { isPoliceId } from "@/lib/fonts";
import { PersonnalisationForm } from "./PersonnalisationForm";
import { PREVIEW_DEMO_CONTENT } from "@/lib/preview/demo-content";

export default async function PersonnalisationPage() {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const t = await getTranslations("admin.personnalisation");
  const supabase = await createClient();
  const theme = await getAccountTheme(supabase, account.id);
  const currentPolice = theme?.police && isPoliceId(theme.police) ? theme.police : "default";

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-foreground">{t("intro")}</p>

      <PersonnalisationForm
        accountId={account.id}
        nomAffichage={account.nom_affichage}
        currentPolice={currentPolice}
        currentDisposition={theme?.disposition_photos ?? "grille"}
        currentEspeces={theme?.disposition_especes ?? "liste"}
        currentPresentation={theme?.disposition_presentation ?? "photo_texte"}
        defaultPrimary={theme?.couleur_primaire ?? "#221c16"}
        defaultSecondary={theme?.couleur_secondaire ?? "#efe9e0"}
        logoUrl={theme?.logo_url ?? null}
        previewContent={PREVIEW_DEMO_CONTENT}
      />
    </div>
  );
}
