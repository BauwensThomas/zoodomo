import type { AnimalView } from "@/types";

function makeViews(animalId: string, count: number, daysSpread: number): AnimalView[] {
  return Array.from({ length: count }, (_, i) => {
    const daysAgo = Math.round((i / count) * daysSpread);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      id: `view-${animalId}-${i}`,
      animal_id: animalId,
      viewed_at: date.toISOString(),
    };
  });
}

export const mockAnimalViews: AnimalView[] = [
  ...makeViews("animal-rex", 42, 60),
  ...makeViews("animal-luna", 27, 30),
  ...makeViews("animal-nino", 9, 20),
  ...makeViews("animal-fifi", 18, 90),
  ...makeViews("animal-bella", 35, 15),
  ...makeViews("animal-max", 22, 15),
  ...makeViews("animal-charlie", 51, 120),
];
