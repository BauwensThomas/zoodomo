import { cookies } from "next/headers";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicRatingSummary, listBestComments } from "@/lib/mock";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Zoodomo : fiches animaux pour refuges et vendeurs professionnels",
  description:
    "Publiez en ligne les animaux disponibles à l'adoption ou à la vente, sans coder : photos, description, statut, un lien direct par espèce à intégrer sur votre propre site.",
  openGraph: {
    title: "Zoodomo",
    description:
      "Publiez en ligne les animaux disponibles à l'adoption ou à la vente, sans coder.",
    url: "https://www.zoodomo.com",
    siteName: "Zoodomo",
    locale: "fr_FR",
    type: "website",
  },
};

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
