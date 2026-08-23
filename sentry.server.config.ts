// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://190f6e2b275eb1a6d4927a1fa381e4e1@o4511961557762048.ingest.de.sentry.io/4511961571197008",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  beforeSend(event, hint) {
    // Faux positif connu de Next.js (pas un bug applicatif) : un client qui interrompt une
    // requête de page (RSC) en cours (rechargement Fast Refresh en dev, navigation rapide,
    // onglet fermé en prod) est signalé à `onRequestError` comme une erreur serveur, alors
    // que c'est une déconnexion normale côté client. Voir
    // https://github.com/vercel/next.js/issues/96704, confirmé le 2026-08-23 sur un vrai
    // événement (survenu juste après un "Fast Refresh... full reload" dans les logs).
    const message = hint.originalException instanceof Error ? hint.originalException.message : "";
    if (message.includes("The destination stream closed early")) return null;
    return event;
  },
});
