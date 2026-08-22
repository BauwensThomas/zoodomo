import { redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/mock/auth";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ReinitialiserMotDePassePage() {
  // Session posée par `verifyOtp({ type: "recovery" })` dans `src/app/auth/confirm/route.ts` :
  // sans session ici, le lien n'a pas été suivi correctement (expiré, déjà utilisé, accès
  // direct à l'URL). Retour au formulaire de demande plutôt qu'une page cassée.
  const account = await getSessionAccount();
  if (!account) redirect("/mot-de-passe-oublie");

  return <ResetPasswordForm />;
}
