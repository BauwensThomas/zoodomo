import type { SupabaseClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/types";
import { getRatingLinkForAccount } from "./store";

export interface RatingRequestContent {
  subject: string;
  body: string;
  buttonLabel: string;
  linkUrl: string | null;
  alreadyVoted: boolean;
}

/** Contenu du message "avis_demande", recalculé à chaque affichage dans la langue passée en
 * paramètre (pas figé dans la langue du compte au moment de l'envoi, contrairement à tous
 * les autres types de message) : sujet/corps traduits via `admin.messages`, et lien de vote
 * toujours celui du dernier token en date pour ce compte (`getRatingLinkForAccount`), même si
 * une relance a été envoyée depuis. Décision utilisateur du 2026-08-25. `baseUrl` sans slash
 * final (ex. `https://zoodomo.com` ou `http://localhost:3000`). */
export async function resolveRatingRequestContent(
  supabase: SupabaseClient,
  accountId: string,
  locale: Locale,
  baseUrl: string
): Promise<RatingRequestContent> {
  const [t, link] = await Promise.all([
    getTranslations({ locale, namespace: "admin.messages" }),
    getRatingLinkForAccount(supabase, accountId),
  ]);

  const alreadyVoted = link?.alreadyVoted ?? false;
  return {
    subject: t("ratingRequestSubject"),
    body: t("ratingRequestBody"),
    buttonLabel: alreadyVoted ? t("ratingRequestAlreadyVoted") : t("ratingRequestButton"),
    linkUrl: link && !alreadyVoted ? `${baseUrl}/avis/${link.token}` : null,
    alreadyVoted,
  };
}
