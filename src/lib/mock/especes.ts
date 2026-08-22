import type { Espece } from "@/types";

/**
 * Référentiel global espèces (brief section 5, liste indicative complète : petits animaux,
 * NAC, animaux de ferme). La race/sous-espèce n'est plus gérée ici (voir `Animal.race` dans
 * `src/types/index.ts`) : seule l'espèce reste une table de référence, nécessaire au
 * filtrage par espèce sur les pages publiques (`/[compte]/[espece]`).
 *
 * Les `id` ci-dessous sont les vrais UUID de la table `especes` dans Supabase (générés par
 * `gen_random_uuid()` à leur insertion, `supabase/migrations/0001_init.sql`), copiés une
 * fois ici plutôt que relus à chaque requête : ce référentiel ne change jamais (pas
 * d'ajout/suppression d'espèce prévu), et `animaux.espece_id` est une vraie clé étrangère
 * vers cette table, donc ces id doivent correspondre exactement. Voir docs/DECISIONS.md
 * (migration complète du 2026-08-22) : un premier passage avait gardé les anciens id
 * fabriqués ("espece-chien", etc.), qui ne matchaient plus aucune ligne réelle et auraient
 * fait échouer toute création de fiche animal (violation de contrainte de clé étrangère).
 */
export const mockEspeces: Espece[] = [
  { id: "b6f9b1a4-5473-4800-bc1e-bf92d80aed06", nom: "Chien", slug: "chien", ordre: 1 },
  { id: "a9315940-2c86-4b64-a231-ed100e351b97", nom: "Chat", slug: "chat", ordre: 2 },
  { id: "e600eb1a-6be0-466f-80d0-d8b96cb98d41", nom: "Lapin", slug: "lapin", ordre: 3 },
  { id: "0ab30d4e-7a9f-4feb-8178-5d12daa51976", nom: "Cochon d'Inde", slug: "cochon-dinde", ordre: 4 },
  { id: "c7f3c81b-56d2-48d9-8a64-9f7048fd045c", nom: "Hamster", slug: "hamster", ordre: 5 },
  { id: "0e361597-bdaa-4d4b-bf18-fb1f377b71b1", nom: "Furet", slug: "furet", ordre: 6 },
  { id: "2abce57b-12e6-44d2-a816-cf1b0e8c2880", nom: "Rat / souris", slug: "rat-souris", ordre: 7 },
  { id: "c253aafb-b3e5-4a42-9211-33038038501b", nom: "Chinchilla", slug: "chinchilla", ordre: 8 },
  { id: "baf35279-4daf-43e8-bfce-a3c14efbe3c6", nom: "Gerbille", slug: "gerbille", ordre: 9 },
  { id: "5fa7cbc5-f52e-4e7f-b50b-562a15e4ce55", nom: "Oiseau", slug: "oiseau", ordre: 10 },
  { id: "740975cb-aa30-4101-ac93-22eb11c59fba", nom: "Tortue", slug: "tortue", ordre: 11 },
  { id: "e2420a7a-9fbf-420e-9219-956ee9ae46b0", nom: "Serpent", slug: "serpent", ordre: 12 },
  { id: "2fea1164-5a28-46c9-90de-1c2de39ad8e2", nom: "Lézard", slug: "lezard", ordre: 13 },
  { id: "7f7c63c6-2bf7-4e55-8030-6f111b060fa7", nom: "Poisson", slug: "poisson", ordre: 14 },
  { id: "08009c8b-af14-4b9c-99ca-6e2d9e2818b6", nom: "Cheval / poney / âne", slug: "cheval", ordre: 15 },
  { id: "9a54e100-6c67-4fde-b435-5e5311032c0d", nom: "Chèvre", slug: "chevre", ordre: 16 },
  { id: "bef5ecab-408e-4353-ab6c-d50d0ad7c63e", nom: "Mouton", slug: "mouton", ordre: 17 },
  { id: "2dc630bd-6742-479b-ae05-c84c25efbde9", nom: "Cochon", slug: "cochon", ordre: 18 },
  { id: "90f777e2-7fef-46b9-9d8a-c43e0ac159b3", nom: "Poule / coq", slug: "poule-coq", ordre: 19 },
];
