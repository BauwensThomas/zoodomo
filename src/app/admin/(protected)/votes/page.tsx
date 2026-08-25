import { Star } from "lucide-react";
import { listSubmittedRatings, getLastRatingInviteDate } from "@/lib/mock";
import { createAdminClient } from "@/lib/supabase/admin";
import { SendRatingRequestsButton } from "./SendRatingRequestsButton";

// Page admin volontairement en français uniquement (équipe Zoodomo interne), pas de
// next-intl ici contrairement au reste de l'app. `createAdminClient()` (service_role)
// requis : `account_ratings` n'a aucun GRANT pour le rôle `authenticated` (voir
// `supabase/migrations/0019_account_ratings.sql`), le client de session échouerait ici avec
// une erreur "permission denied" silencieusement avalée, bug réel constaté (l'onglet
// affichait "Aucun avis reçu" même avec un vrai avis soumis en base), même cause que le
// correctif appliqué à l'onglet Photos, voir docs/DECISIONS.md.
export default async function AdminVotesPage() {
  const admin = createAdminClient();
  const [ratings, lastInviteDate] = await Promise.all([
    listSubmittedRatings(admin),
    getLastRatingInviteDate(admin),
  ]);

  return (
    <section>
      <h1 className="flex items-center gap-2 font-heading text-xl font-medium text-foreground">
        <Star className="h-5 w-5" />
        Votes ({ratings.length})
      </h1>

      <p className="mt-1.5 text-sm text-foreground">
        {lastInviteDate
          ? `Dernière demande de vote envoyée le ${new Date(lastInviteDate).toLocaleString("fr", {
              dateStyle: "short",
              timeStyle: "short",
            })}.`
          : "Aucune demande de vote envoyée pour le moment."}
      </p>

      <div className="mt-4">
        <SendRatingRequestsButton />
      </div>

      {ratings.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-sm text-foreground">
          Aucun avis reçu pour le moment.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {ratings.map((rating) => (
            <div key={rating.id} className="rounded-2xl border border-foreground bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{rating.account_nom}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-4 w-4 ${
                          n <= (rating.stars ?? 0) ? "fill-amber-400 text-amber-400" : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="shrink-0 text-xs text-foreground">
                    {rating.submitted_at &&
                      new Date(rating.submitted_at).toLocaleString("fr", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                  </p>
                </div>
              </div>
              {rating.comment && (
                <p className="mt-2 whitespace-pre-line text-sm text-foreground">{rating.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
