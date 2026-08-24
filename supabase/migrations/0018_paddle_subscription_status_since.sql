-- Date du dernier changement de `paddle_subscription_status` (mis à jour uniquement quand le
-- statut change réellement, pas à chaque livraison de webhook, voir
-- `upsertAccountPaddleSubscription` dans src/lib/mock/store.ts). Sert de point de départ au
-- délai de grâce de la page publique quand un abonnement payant cesse d'être actif (paiement
-- échoué, résilié), même mécanique que le délai de grâce déjà existant pour la fin d'essai
-- (`GRACE_HOURS`, src/lib/mock/helpers.ts), demande utilisateur du 2026-08-24 : contrairement
-- à l'accès dashboard (coupé immédiatement dans les deux cas), la page publique reste
-- visible encore quelques jours avant de disparaître.
alter table accounts
  add column paddle_subscription_status_changed_at timestamptz;
