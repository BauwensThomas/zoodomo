-- Permet de masquer la page publique d'un compte indépendamment de son statut d'abonnement
-- (utile pour un compte de test/démo interne : dashboard utilisable normalement, mais pas de
-- fiche publique visible par de vrais visiteurs). Voir docs/DECISIONS.md.
alter table accounts
  add column page_publique_visible boolean not null default true;
