// Crée une seule fois le produit "Zoodomo" et ses deux prix (mensuel/annuel) côté Paddle.
// Pas de période d'essai ici : l'essai gratuit de 15 jours est déjà géré côté app
// (accounts.plan = "essai"), pas besoin de le dupliquer côté Paddle. Voir docs/DECISIONS.md.
//
// Exécution (charge PADDLE_API_KEY depuis .env.local) :
//   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/seed-paddle-catalog.ts
//
// Pour l'environnement Live : PADDLE_SEED_LIVE=1 avec une vraie clé API Live dans
// PADDLE_API_KEY (catalogues Sandbox et Live totalement séparés, à rejouer une fois pour
// chacun), voir docs/DECISIONS.md.
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.PADDLE_SEED_LIVE === "1" ? Environment.production : Environment.sandbox,
});

async function seed() {
  const product = await paddle.products.create({
    name: "Zoodomo",
    taxCategory: "saas",
    description: "Abonnement Zoodomo : fiches animaux pour refuges et vendeurs professionnels.",
  });

  // `quantity: { minimum: 1, maximum: 1 }` : sans ça, Paddle autorise 1 à 100 par défaut et
  // affiche un sélecteur +/- au checkout, sans aucun sens pour un abonnement Zoodomo (un
  // compte = un abonnement, jamais plusieurs). Corrige le problème à la racine côté Paddle,
  // plutôt qu'un contournement côté client (voir `PlanPopup.tsx`, gardé en filet de sécurité).
  const monthly = await paddle.prices.create({
    productId: product.id,
    description: "Zoodomo mensuel EUR",
    unitPrice: { amount: "1900", currencyCode: "EUR" },
    billingCycle: { interval: "month", frequency: 1 },
    quantity: { minimum: 1, maximum: 1 },
  });

  const yearly = await paddle.prices.create({
    productId: product.id,
    description: "Zoodomo annuel EUR",
    unitPrice: { amount: "19000", currencyCode: "EUR" },
    billingCycle: { interval: "year", frequency: 1 },
    quantity: { minimum: 1, maximum: 1 },
  });

  console.log(
    JSON.stringify(
      { productId: product.id, monthlyPriceId: monthly.id, yearlyPriceId: yearly.id },
      null,
      2
    )
  );
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
