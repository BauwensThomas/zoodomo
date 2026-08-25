import { cookies } from "next/headers";
import { signupsEnabled } from "@/lib/signups";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicRatingSummary, listBestComments } from "@/lib/mock";
import { InscriptionForm } from "./InscriptionForm";

export default async function InscriptionPage() {
  const theme = (await cookies()).get("THEME_PREFERENCE")?.value;

  const admin = createAdminClient();
  const ratingSummary = await getPublicRatingSummary(admin);
  const testimonials = ratingSummary ? await listBestComments(admin) : [];

  return (
    <div
      className="app-theme-scope"
      data-theme={theme === "light" ? "light" : theme === "dark" ? "dark" : undefined}
    >
      <InscriptionForm
        signupsEnabled={signupsEnabled()}
        ratingSummary={ratingSummary}
        testimonials={testimonials}
      />
    </div>
  );
}
