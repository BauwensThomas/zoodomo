-- 0008_account_message_log.sql : les messages automatiques (bienvenue, essai gratuit,
-- rappels d'échéance, rappel de fiche périmée) revenaient non lus juste après avoir été
-- supprimés définitivement (bug réel remonté par l'utilisateur, découvert une fois
-- 0007_account_messages_delete.sql appliqué : la suppression fonctionne enfin, ce qui a
-- exposé le vrai problème). Cause : `hasAccountMessage` (garde-fou anti-doublon dans
-- `ensureAutomaticMessages`, src/app/espace/layout.tsx) vérifiait la présence d'une ligne
-- dans `account_messages` elle-même ; une fois cette ligne supprimée pour de bon, le
-- garde-fou ne voyait plus rien et régénérait le message au chargement suivant du tableau
-- de bord, en boucle.
--
-- Corrigé avec un journal séparé, jamais touché par la suppression d'un message visible :
-- "un message de ce type a déjà été envoyé" doit rester vrai pour toujours, que le compte
-- l'ait gardé, archivé, mis à la corbeille ou supprimé définitivement de sa boîte.
create table account_message_log (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  kind text not null,
  animal_id uuid references animaux(id) on delete cascade,
  sent_at timestamptz not null default now()
);

-- Deux index uniques partiels plutôt qu'une seule contrainte `unique(account_id, kind,
-- animal_id)` : en SQL, NULL n'est jamais égal à NULL, donc une contrainte unique classique
-- laisserait passer plusieurs lignes "bienvenue" (animal_id toujours NULL) pour un même
-- compte. Un index partiel dédié aux lignes sans animal comble ce trou.
create unique index account_message_log_global_key on account_message_log (account_id, kind)
  where animal_id is null;
create unique index account_message_log_animal_key on account_message_log (account_id, kind, animal_id)
  where animal_id is not null;

create policy "account_message_log_select_own" on account_message_log
  for select using (auth.uid() = account_id);

create policy "account_message_log_insert_own" on account_message_log
  for insert with check (auth.uid() = account_id);

grant select, insert on account_message_log to authenticated;

-- Backfill : chaque message automatique déjà envoyé (qu'il soit encore dans la boîte de
-- réception, archivé, à la corbeille, ou déjà supprimé avant ce correctif s'il en reste une
-- trace) obtient sa ligne de journal, pour ne jamais être régénéré même si le compte le
-- supprime maintenant. `on conflict do nothing` : `account_messages` peut légitimement avoir
-- plusieurs lignes "rappel_fiche" pour des animaux différents, mais l'index unique empêche
-- un doublon exact (même compte/genre/animal), sans faire échouer tout l'insert.
insert into account_message_log (account_id, kind, animal_id, sent_at)
select distinct on (account_id, kind, animal_id) account_id, kind, animal_id, created_at
from account_messages
where kind != 'admin'
order by account_id, kind, animal_id, created_at asc
on conflict do nothing;
