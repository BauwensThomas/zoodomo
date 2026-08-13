import type { StatutAnimal } from "@/types";

export const STATUT_BADGE_CLASS: Record<StatutAnimal, string> = {
  disponible: "bg-emerald-100 text-emerald-700",
  reserve: "bg-amber-100 text-amber-700",
  adopte: "bg-rose-100 text-rose-700",
};
