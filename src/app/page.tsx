import { cookies } from "next/headers";
import { LoginForm } from "./LoginForm";

export default async function Home() {
  const theme = (await cookies()).get("THEME_PREFERENCE")?.value;

  return (
    <div
      className="app-theme-scope"
      data-theme={theme === "light" ? "light" : theme === "dark" ? "dark" : undefined}
    >
      <LoginForm />
    </div>
  );
}
