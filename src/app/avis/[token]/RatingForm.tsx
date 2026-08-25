"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { submitRatingAction, type SubmitRatingState } from "./actions";

const initialState: SubmitRatingState = {};

/** Longueur maximum d'un commentaire d'avis, décision utilisateur du 2026-08-25 (calée sur un
 * exemple concret fourni : environ 100 caractères, arrondi à 110). Volontairement court : le
 * commentaire s'affiche sur 2 lignes maximum dans le widget de la page de connexion
 * (`line-clamp-2`, `TestimonialCarousel.tsx`), un texte plus long serait de toute façon
 * tronqué visuellement là-bas. */
const MAX_COMMENT_LENGTH = 110;

export function RatingForm({
  token,
  starsLabel,
  commentLabel,
  commentPlaceholder,
  charactersRemainingLabel,
  submitButton,
  thankYouTitle,
  thankYouBody,
  errorInvalid,
}: {
  token: string;
  starsLabel: string;
  commentLabel: string;
  commentPlaceholder: string;
  charactersRemainingLabel: string;
  submitButton: string;
  thankYouTitle: string;
  thankYouBody: string;
  errorInvalid: string;
}) {
  const [state, formAction, pending] = useActionState(submitRatingAction, initialState);
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");

  if (state.submitted) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <h2 className="mt-3 font-heading text-lg font-medium text-emerald-900">{thankYouTitle}</h2>
        <p className="mt-1.5 text-sm text-emerald-900">{thankYouBody}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="stars" value={stars} />

      <div>
        <p className="text-sm font-medium text-foreground">{starsLabel}</p>
        <div className="mt-2 flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${n} ${starsLabel}`}
              className="cursor-pointer p-0.5"
            >
              <Star
                className={`h-8 w-8 ${
                  n <= (hovered || stars) ? "fill-amber-400 text-amber-400" : "text-border"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-foreground">
          {commentLabel}
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          maxLength={MAX_COMMENT_LENGTH}
          placeholder={commentPlaceholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground"
        />
        <p className="mt-1 text-right text-xs text-foreground">
          {MAX_COMMENT_LENGTH - comment.length} {charactersRemainingLabel}
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600">{errorInvalid}</p>}

      <button
        type="submit"
        disabled={stars === 0 || pending}
        className="cursor-pointer rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitButton}
      </button>
    </form>
  );
}
