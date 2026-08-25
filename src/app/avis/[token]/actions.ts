"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { submitRating } from "@/lib/mock";

export interface SubmitRatingState {
  error?: boolean;
  submitted?: boolean;
}

/** Page publique sans session Supabase (`/avis/[token]`) : client `service_role` requis,
 * `account_ratings` n'a aucune policy RLS. `getRatingByToken` (dans la page) garantit déjà
 * qu'un token soumis ne réaffiche pas le formulaire, mais `submitRating` reste garde par
 * `submitted_at is null` en base pour un double clic/soumission concurrente. */
export async function submitRatingAction(
  _prevState: SubmitRatingState,
  formData: FormData
): Promise<SubmitRatingState> {
  const token = String(formData.get("token") || "");
  const stars = Number(formData.get("stars") || 0);
  const comment = String(formData.get("comment") || "").trim();

  if (!token || stars < 1 || stars > 5) return { error: true };

  const admin = createAdminClient();
  await submitRating(admin, token, stars, comment || null);
  return { submitted: true };
}
