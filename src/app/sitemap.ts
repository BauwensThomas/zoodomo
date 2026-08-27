import type { MetadataRoute } from "next";
import {
  listAccounts,
  listAnimauxByAccountAll,
  isAnimalVisiblePublicly,
  mockEspeces,
} from "@/lib/mock";
import { isPublicPageBlocked } from "@/lib/mock/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

// Domaine en dur plutôt qu'une variable d'environnement : c'est le seul domaine canonique du
// site (déjà celui utilisé partout ailleurs, Supabase/Paddle/emails), voir docs/DECISIONS.md.
const BASE_URL = "https://www.zoodomo.com";

// Uniquement les routes publiques (`/[compte]/...`) : jamais `/espace`, `/admin`, `/avis/[token]`
// (lien à usage unique envoyé par email, pas fait pour être découvert par un moteur de
// recherche) ni les pages transactionnelles (vérification email, réinitialisation). Voir
// `robots.ts` pour l'exclusion complémentaire de `/espace`/`/admin`.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/tarifs`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/inscription`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/conditions-utilisation`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/politique-confidentialite`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/politique-remboursement`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const accounts = (await listAccounts(supabase)).filter((a) => !isPublicPageBlocked(a));

  // Une seule requête par compte (`listAnimauxByAccountAll`), regroupement par espèce fait
  // ensuite en mémoire : la version précédente rappelait `getEspecesAvecAnimauxVisibles` puis
  // `getAnimauxVisibles` par espèce, qui refont chacune une requête complète de tous les
  // animaux du compte (N+1, jusqu'à un appel de trop par espèce représentée). Sans
  // conséquence visible avec la poignée de vrais comptes actuels, mais fait planter le build
  // (timeout) à l'échelle testée par le test de charge du 2026-08-27 (1500 comptes), voir
  // docs/DECISIONS.md.
  const accountEntries: MetadataRoute.Sitemap = [];
  for (const account of accounts) {
    accountEntries.push({
      url: `${BASE_URL}/${account.slug}`,
      lastModified: account.created_at,
      changeFrequency: "weekly",
      priority: 0.7,
    });

    const animauxVisibles = (await listAnimauxByAccountAll(supabase, account.id)).filter(
      isAnimalVisiblePublicly
    );
    const especeIds = new Set(animauxVisibles.map((a) => a.espece_id));
    const especes = mockEspeces.filter((e) => especeIds.has(e.id)).sort((a, b) => a.ordre - b.ordre);

    for (const espece of especes) {
      accountEntries.push({
        url: `${BASE_URL}/${account.slug}/${espece.slug}`,
        lastModified: account.created_at,
        changeFrequency: "weekly",
        priority: 0.6,
      });

      for (const animal of animauxVisibles.filter((a) => a.espece_id === espece.id)) {
        accountEntries.push({
          url: `${BASE_URL}/${account.slug}/${espece.slug}/${animal.slug}`,
          lastModified: animal.updated_at,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    }
  }

  return [...staticEntries, ...accountEntries];
}
