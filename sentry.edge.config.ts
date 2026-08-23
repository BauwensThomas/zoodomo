// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
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
    // Voir sentry.server.config.ts pour l'explication complète : faux positif connu de
    // Next.js (https://github.com/vercel/next.js/issues/96704), pas un bug applicatif.
    const message = hint.originalException instanceof Error ? hint.originalException.message : "";
    if (message.includes("The destination stream closed early")) return null;
    return event;
  },
});
