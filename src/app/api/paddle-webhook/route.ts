import { NextRequest } from "next/server";
import { getPaddleInstance } from "@/lib/paddle/server";
import { processEvent } from "@/lib/paddle/process-webhook";

/** Reçoit les évènements Paddle (abonnement créé/mis à jour/résilié, client créé/mis à
 * jour). Seule une réponse 2xx marque la livraison comme réussie côté Paddle : toute autre
 * réponse (y compris une signature invalide) déclenche une nouvelle tentative selon le
 * calendrier de Paddle, jamais de distinction fine entre les causes d'échec ici (impossible
 * à distinguer de façon fiable), voir la compétence d'agent `paddle-webhooks`.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("paddle-signature") ?? "";
  const rawBody = await request.text();
  const secret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET ?? "";

  if (!signature || !rawBody) {
    return Response.json({ error: "Missing signature or body" }, { status: 400 });
  }

  try {
    const paddle = getPaddleInstance();
    const eventData = await paddle.webhooks.unmarshal(rawBody, secret, signature);
    if (eventData) await processEvent(eventData);
    return Response.json({ received: true });
  } catch (e) {
    console.error("Paddle webhook error:", e);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
