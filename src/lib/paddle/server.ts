import { Environment, LogLevel, Paddle, type PaddleOptions } from "@paddle/paddle-node-sdk";

/** Instance unique du SDK Paddle (server-side, `PADDLE_API_KEY`), utilisée par le webhook
 * (`src/app/api/paddle-webhook/route.ts`) pour vérifier la signature des évènements reçus. */
export function getPaddleInstance() {
  if (!process.env.PADDLE_API_KEY) throw new Error("PADDLE_API_KEY is not set");

  const options: PaddleOptions = {
    environment:
      process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? Environment.production : Environment.sandbox,
    logLevel: LogLevel.error,
  };
  return new Paddle(process.env.PADDLE_API_KEY, options);
}
