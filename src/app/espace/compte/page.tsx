import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionAccount } from "@/lib/mock/auth";
import { createClient } from "@/lib/supabase/server";
import { getAccountTheme, getAccountPhotos } from "@/lib/mock";
import { ComptePageForm } from "./ComptePageForm";
import { ManageSubscriptionButton } from "./ManageSubscriptionButton";

export default async function ComptePage() {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const t = await getTranslations("admin.compte");
  const supabase = await createClient();
  const [theme, photos] = await Promise.all([
    getAccountTheme(supabase, account.id),
    getAccountPhotos(supabase, account.id),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
        {t("title")}
      </h1>

      <ComptePageForm
        account={account}
        lienRetourSite={theme?.lien_retour_site ?? null}
        photoUrls={photos.map((p) => p.url)}
      />

      {account.paddle_subscription_id && (
        <div className="mt-8 max-w-2xl rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-medium text-foreground">
            {t("sectionAbonnement")}
          </h2>
          <p className="mt-1.5 text-sm text-foreground">{t("manageSubscriptionHint")}</p>
          <div className="mt-4">
            <ManageSubscriptionButton
              label={t("manageSubscription")}
              error={t("manageSubscriptionError")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
