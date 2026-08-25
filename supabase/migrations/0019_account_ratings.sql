-- Avis clients par étoiles (demande utilisateur, 2026-08-24) : l'admin invite les comptes
-- actifs n'ayant pas encore voté (bouton, `sendRatingRequestsAction`), le pro vote via un lien
-- public par token, sans reconnexion. `account_id unique` : un seul avis par compte, jamais
-- plusieurs lignes (une relance régénère `token`/`invited_at` sur la même ligne, voir
-- `upsertRatingInvite`). Pas de policy RLS : ni `anon` ni `authenticated` n'ont besoin d'y
-- accéder directement, uniquement via `createAdminClient()` côté serveur (envoi, page
-- publique de vote résolue par token, onglet Votes admin), voir docs/DECISIONS.md.
create table account_ratings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references accounts(id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  stars smallint check (stars between 1 and 5),
  comment text,
  invited_at timestamptz not null default now(),
  submitted_at timestamptz
);

create unique index account_ratings_token_idx on account_ratings (token);
