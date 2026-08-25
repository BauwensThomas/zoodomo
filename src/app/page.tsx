import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicRatingSummary, listBestComments } from "@/lib/mock";
import { LoginForm } from "./LoginForm";

export default async function Home() {
  const theme = (await cookies()).get("THEME_PREFERENCE")?.value;

  const admin = createAdminClient();
  const ratingSummary = await getPublicRatingSummary(admin);
  const testimonials = ratingSummary ? await listBestComments(admin) : [];

  return (
    <div
      className="app-theme-scope"
      data-theme={theme === "light" ? "light" : theme === "dark" ? "dark" : undefined}
    >
      <LoginForm ratingSummary={ratingSummary} testimonials={testimonials} />
    </div>
  );
}
