"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface Testimonial {
  stars: number;
  comment: string;
}

/** Widget d'avis de la page de connexion : moyenne + rotation des meilleurs commentaires
 * toutes les 10s, décision utilisateur du 2026-08-24. Pas de précédent de rotation
 * temporisée dans l'app (`PhotoCarousel.tsx` est manuel), nouveau composant. */
export function TestimonialCarousel({
  ratingLabel,
  average,
  comments,
}: {
  ratingLabel: string;
  average: number;
  comments: Testimonial[];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (comments.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % comments.length), 10_000);
    return () => clearInterval(timer);
  }, [comments.length]);

  return (
    <div className="mt-2 text-center">
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-4 w-4 ${
                n <= Math.round(average) ? "fill-amber-400 text-amber-400" : "text-border"
              }`}
            />
          ))}
        </div>
        <p className="text-sm font-medium text-foreground">{ratingLabel}</p>
      </div>

      {comments.length > 0 && (
        <div className="mt-2">
          <p className="line-clamp-2 text-sm italic text-foreground">&ldquo;{comments[index].comment}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
