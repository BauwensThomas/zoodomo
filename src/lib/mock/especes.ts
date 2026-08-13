import type { Espece } from "@/types";

/**
 * Référentiel global espèces (brief section 5, liste indicative complète : petits animaux,
 * NAC, animaux de ferme). La race/sous-espèce n'est plus gérée ici (voir `Animal.race` dans
 * `src/types/index.ts`) : seule l'espèce reste une table de référence, nécessaire au
 * filtrage par espèce sur les pages publiques (`/[compte]/[espece]`).
 */
export const mockEspeces: Espece[] = [
  { id: "espece-chien", nom: "Chien", slug: "chien", ordre: 1 },
  { id: "espece-chat", nom: "Chat", slug: "chat", ordre: 2 },
  { id: "espece-lapin", nom: "Lapin", slug: "lapin", ordre: 3 },
  { id: "espece-cochon-inde", nom: "Cochon d'Inde", slug: "cochon-dinde", ordre: 4 },
  { id: "espece-hamster", nom: "Hamster", slug: "hamster", ordre: 5 },
  { id: "espece-furet", nom: "Furet", slug: "furet", ordre: 6 },
  { id: "espece-rat-souris", nom: "Rat / souris", slug: "rat-souris", ordre: 7 },
  { id: "espece-chinchilla", nom: "Chinchilla", slug: "chinchilla", ordre: 8 },
  { id: "espece-gerbille", nom: "Gerbille", slug: "gerbille", ordre: 9 },
  { id: "espece-oiseau", nom: "Oiseau", slug: "oiseau", ordre: 10 },
  { id: "espece-tortue", nom: "Tortue", slug: "tortue", ordre: 11 },
  { id: "espece-serpent", nom: "Serpent", slug: "serpent", ordre: 12 },
  { id: "espece-lezard", nom: "Lézard", slug: "lezard", ordre: 13 },
  { id: "espece-poisson", nom: "Poisson", slug: "poisson", ordre: 14 },
  { id: "espece-cheval", nom: "Cheval / poney / âne", slug: "cheval", ordre: 15 },
  { id: "espece-chevre", nom: "Chèvre", slug: "chevre", ordre: 16 },
  { id: "espece-mouton", nom: "Mouton", slug: "mouton", ordre: 17 },
  { id: "espece-cochon", nom: "Cochon", slug: "cochon", ordre: 18 },
  { id: "espece-poule-coq", nom: "Poule / coq", slug: "poule-coq", ordre: 19 },
];
