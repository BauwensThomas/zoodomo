import {
  EventName,
  type EventEntity,
  type SubscriptionCreatedEvent,
  type SubscriptionUpdatedEvent,
  type SubscriptionCanceledEvent,
  type CustomerCreatedEvent,
  type CustomerUpdatedEvent,
} from "@paddle/paddle-node-sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  linkAccountPaddleCustomerId,
  getAccountByPaddleCustomerId,
  upsertAccountPaddleSubscription,
  type PaddleSubscriptionStatus,
} from "@/lib/mock/store";
import { getPaddleInstance } from "@/lib/paddle/server";

/** Paddle livre au moins une fois : le même `event.eventId` peut arriver plusieurs fois
 * (nouvelles tentatives tant qu'une réponse 2xx n'a pas été reçue). Chaque handler ci-dessous
 * fait un UPSERT (par email ou par `paddle_customer_id`), donc une livraison répétée
 * converge simplement vers le même état final, sans effet de bord supplémentaire. */
export async function processEvent(event: EventEntity) {
  switch (event.eventType) {
    case EventName.CustomerCreated:
    case EventName.CustomerUpdated:
      return handleCustomer(event);
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionCanceled:
      return handleSubscription(event);
    default:
      return;
  }
}

async function handleCustomer(event: CustomerCreatedEvent | CustomerUpdatedEvent) {
  const admin = createAdminClient();
  await linkAccountPaddleCustomerId(admin, event.data.email, event.data.id);
}

function priceIdToPlan(priceId: string): "mensuel" | "annuel" | null {
  if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_MONTHLY) return "mensuel";
  if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_ANNUAL) return "annuel";
  return null;
}

async function handleSubscription(
  event: SubscriptionCreatedEvent | SubscriptionUpdatedEvent | SubscriptionCanceledEvent
) {
  const admin = createAdminClient();
  const sub = event.data;

  let account = await getAccountByPaddleCustomerId(admin, sub.customerId);
  if (!account) {
    // Livraison désordonnée (déjà rencontrée par Paddle, voir la compétence d'agent
    // `paddle-webhooks`) : le customer.created correspondant n'est pas encore arrivé. Se
    // rattrape en récupérant l'email directement via l'API plutôt que d'abandonner.
    const paddle = getPaddleInstance();
    const customer = await paddle.customers.get(sub.customerId);
    await linkAccountPaddleCustomerId(admin, customer.email, sub.customerId);
    account = await getAccountByPaddleCustomerId(admin, sub.customerId);
    if (!account) return; // Aucun compte Zoodomo pour ce client Paddle : rien à faire.
  }

  const priceId = sub.items[0]?.price?.id ?? "";
  await upsertAccountPaddleSubscription(admin, account.id, {
    paddleCustomerId: sub.customerId,
    paddleSubscriptionId: sub.id,
    status: sub.status as PaddleSubscriptionStatus,
    plan: priceIdToPlan(priceId),
  });
}
