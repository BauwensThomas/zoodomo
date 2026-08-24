-- Rattache un abonnement Paddle réel à chaque compte (remplace `choisirPlanAction`, qui ne
-- faisait qu'enregistrer le choix sans paiement, voir docs/DECISIONS.md et la compétence
-- d'agent `paddle-subscription-sync`). `plan` (déjà existant) reste le plan choisi
-- historiquement ; `paddle_subscription_status` est le signal temps réel utilisé pour
-- l'accès réel (actif/en essai/impayé/en pause/résilié), mis à jour uniquement par le
-- webhook `/api/paddle-webhook`, jamais directement par l'app.
alter table accounts
  add column paddle_customer_id text,
  add column paddle_subscription_id text,
  add column paddle_subscription_status text
    check (paddle_subscription_status in ('active', 'trialing', 'past_due', 'paused', 'canceled'));

create index accounts_paddle_customer_id_idx on accounts (paddle_customer_id);
create index accounts_paddle_subscription_id_idx on accounts (paddle_subscription_id);
