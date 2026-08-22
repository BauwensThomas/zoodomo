"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ResendState {
  saved: boolean;
  savedAt?: number;
}

/** `email` fourni par `ResendLinkButton` via `.bind(null, email)` (pas de session à ce stade,
 * voir `src/app/verification-email/page.tsx`) : `useActionState` appelle ensuite cette
 * fonction avec (state, formData), le premier paramètre étant déjà fixé par le `.bind`. Les
 * deux derniers ne sont pas utilisés, mais la signature est imposée par `useActionState`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function resendVerificationAction(email: string, _prevState: ResendState, _formData: FormData): Promise<ResendState> {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";

  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${protocol}://${host}/auth/confirm` },
  });

  revalidatePath("/verification-email");
  return { saved: true, savedAt: Date.now() };
}
