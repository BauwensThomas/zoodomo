import { cookies } from "next/headers";
import { signupsEnabled } from "@/lib/signups";
import { InscriptionForm } from "./InscriptionForm";

export default async function InscriptionPage() {
  const theme = (await cookies()).get("THEME_PREFERENCE")?.value;

  return (
    <div
      className="app-theme-scope"
      data-theme={theme === "light" ? "light" : theme === "dark" ? "dark" : undefined}
    >
      <InscriptionForm signupsEnabled={signupsEnabled()} />
    </div>
  );
}
