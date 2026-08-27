import type { MetadataRoute } from "next";
import { listAccounts, getEspecesAvecAnimauxVisibles, getAnimauxVisibles } from "@/lib/mock";
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

  const accountEntries: MetadataRoute.Sitemap = [];
  for (const account of accounts) {
    accountEntries.push({
      url: `${BASE_URL}/${account.slug}`,
      lastModified: account.created_at,
      changeFrequency: "weekly",
      priority: 0.7,
    });

    const especes = await getEspecesAvecAnimauxVisibles(supabase, account.id);
    for (const espece of especes) {
      accountEntries.push({
        url: `${BASE_URL}/${account.slug}/${espece.slug}`,
        lastModified: account.created_at,
        changeFrequency: "weekly",
        priority: 0.6,
      });

      const animaux = await getAnimauxVisibles(supabase, account.id, espece.id);
      for (const animal of animaux) {
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
