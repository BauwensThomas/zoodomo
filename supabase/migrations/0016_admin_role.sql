-- Remplace le stopgap de la phase mockée (identifiants admin en variable d'environnement,
-- accès via le client service_role qui contourne RLS) par un vrai rôle admin Supabase +
-- policies RLS, voir docs/BRIEF-COMPLET-SAAS-ANIMAUX.md section 9 et docs/DECISIONS.md.
--
-- Approche "table dédiée" : un admin est un utilisateur `auth.users` normal (même mécanisme
-- de connexion que les comptes pro) qui a en plus une ligne dans `admin_users`. N'a pas de
-- ligne dans `accounts` (une table par rôle, pas de recoupement avec les comptes clients).

create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

grant select on admin_users to authenticated;

-- Un utilisateur connecté peut vérifier sa propre appartenance (utilisé par
-- `isAdminSession()`), rien d'autre n'est exposé sur cette table : ni la liste des autres
-- admins, ni une possibilité de s'y ajouter soi-même depuis l'app.
create policy "admin_users_select_own" on admin_users
  for select using ((select auth.uid()) = id);

-- Fonction utilitaire réutilisée par toutes les policies "accès admin" ci-dessous.
-- `security definer` : peut lire `admin_users` même si l'appelant n'y a normalement accès
-- qu'à sa propre ligne (policy ci-dessus). `search_path` fixé explicitement (même précaution
-- que `rls_auto_enable`, voir la correction du Security Advisor du 2026-08-23).
create function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$;

-- Lecture de tous les comptes (page admin : tableau "Comptes clients", diffusion de
-- messages). S'ajoute à `accounts_select_own` déjà en place (policies pour une même
-- commande combinées en OR), ne retire rien aux comptes pro.
create policy "accounts_select_admin" on accounts
  for select using ((select is_admin()));

-- Lecture de tous les animaux (comptage par compte sur le tableau "Comptes clients").
create policy "animaux_select_admin" on animaux
  for select using ((select is_admin()));

-- Messages "contacter le webmaster" : l'admin doit voir tous les statuts (boîte de
-- réception/archives/corbeille, tous comptes confondus), les faire transiter entre statuts,
-- et les supprimer définitivement depuis la corbeille. `support_messages_select_own`/
-- `insert_own` (policies existantes, pro uniquement) restent inchangées.
create policy "support_messages_select_admin" on support_messages
  for select using ((select is_admin()));
create policy "support_messages_update_admin" on support_messages
  for update using ((select is_admin()));
create policy "support_messages_delete_admin" on support_messages
  for delete using ((select is_admin()));

grant update, delete on support_messages to authenticated;

-- Messages admin -> compte (diffusion ou réponse) : lecture pour l'onglet "Envoyés" côté
-- admin, écriture pour l'envoi. `account_messages_*_own` (policies existantes, pro : lire ses
-- propres messages reçus) restent inchangées.
create policy "account_messages_select_admin" on account_messages
  for select using ((select is_admin()));
create policy "account_messages_insert_admin" on account_messages
  for insert with check ((select is_admin()));
