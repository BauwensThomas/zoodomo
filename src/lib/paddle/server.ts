import { Environment, LogLevel, Paddle, type PaddleOptions } from "@paddle/paddle-node-sdk";

/** Instance unique du SDK Paddle (server-side, `PADDLE_API_KEY`), utilisée par le webhook
 * (`src/app/api/paddle-webhook/route.ts`) et les actions serveur qui appellent l'API Paddle
 * (checkout, portail client). Réellement mise en cache au niveau du module (pas juste une
 * nouvelle instance à chaque appel comme avant) : sur `next dev`, processus Node long-vivant,
 * une instance recréée à chaque requête accumulait des écouteurs internes du SDK sans jamais
 * les libérer, jusqu'à déclencher `MaxListenersExceededWarning`, repéré dans les logs du
 * serveur de dev, voir docs/DECISIONS.md. */
let instance: Paddle | null = null;

export function getPaddleInstance(): Paddle {
  if (instance) return instance;
  if (!process.env.PADDLE_API_KEY) throw new Error("PADDLE_API_KEY is not set");

  const options: PaddleOptions = {
    environment:
      process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? Environment.production : Environment.sandbox,
    logLevel: LogLevel.error,
  };
  instance = new Paddle(process.env.PADDLE_API_KEY, options);
  return instance;
}
