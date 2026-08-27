import type { MetadataRoute } from "next";

const BASE_URL = "https://www.zoodomo.com";

// Exigence explicite de l'utilisateur (2026-08-27) : `/espace` (dashboard pro) et `/admin`
// ne doivent jamais être indexés ni explorés. `Disallow` empêche l'exploration ; la balise
// `noindex` posée sur ces mêmes layouts (voir `src/app/espace/layout.tsx`/`src/app/admin/...`)
// empêche en plus l'indexation d'une URL déjà connue par ailleurs (lien partagé, etc.), en
// défense en profondeur. `/auth`, `/avis/[token]` (lien à usage unique) et les pages
// transactionnelles ne sont pas des contenus destinés à la recherche non plus.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/espace",
        "/espace/",
        "/admin",
        "/admin/",
        "/auth/",
        "/avis/",
        "/api/",
        "/verification-email",
        "/reinitialiser-mot-de-passe",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
