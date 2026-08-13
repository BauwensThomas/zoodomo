import { Dog, Cat, Rabbit, Bird, Fish, Turtle, PawPrint, type LucideIcon } from "lucide-react";

const ICONS_BY_SLUG: Record<string, LucideIcon> = {
  chien: Dog,
  chat: Cat,
  lapin: Rabbit,
  oiseau: Bird,
  poisson: Fish,
  tortue: Turtle,
};

export function getEspeceIcon(slug: string): LucideIcon {
  return ICONS_BY_SLUG[slug] ?? PawPrint;
}
