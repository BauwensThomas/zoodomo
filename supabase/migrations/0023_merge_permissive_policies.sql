-- 0023_merge_permissive_policies.sql : `accounts`, `animaux`, `support_messages` et
-- `account_messages` avaient chacune deux policies permissives distinctes pour une même
-- commande (`..._own` pour le compte pro concerné, `..._admin` pour l'admin, ajoutées par
-- 0016_admin_role.sql à côté des policies déjà en place), signalé par le Security Advisor
-- (multiple_permissive_policies, 2026-08-27) : Postgres doit évaluer les deux policies à
-- chaque requête au lieu d'une seule. Fusion en une seule policy par commande, avec un OR,
-- recommandation officielle de Supabase pour ce lint. Comportement strictement identique
-- (own OR admin, exactement ce que deux policies permissives donnaient déjà), simple gain de
-- performance. Fonctions `auth.uid()`/`is_admin()` entourées de `select` (déjà la convention
-- pour `is_admin()`) pour n'être évaluées qu'une fois par requête plutôt qu'une fois par ligne.
-- `is_admin()` appelée en `private.is_admin()` (0022_is_admin_private_schema.sql l'a déplacée
-- hors de `public`, plus résolue automatiquement par le `search_path` par défaut).

-- accounts
drop policy if exists "accounts_select_own" on accounts;
drop policy if exists "accounts_select_admin" on accounts;
create policy "accounts_select_own_or_admin" on accounts
  for select using ((select auth.uid()) = id or (select private.is_admin()));

-- animaux
drop policy if exists "animaux_select_own" on animaux;
drop policy if exists "animaux_select_admin" on animaux;
create policy "animaux_select_own_or_admin" on animaux
  for select using ((select auth.uid()) = account_id or (select private.is_admin()));

-- support_messages
drop policy if exists "support_messages_select_own" on support_messages;
drop policy if exists "support_messages_select_admin" on support_messages;
create policy "support_messages_select_own_or_admin" on support_messages
  for select using ((select auth.uid()) = account_id or (select private.is_admin()));

-- account_messages (select et insert avaient chacune deux policies)
drop policy if exists "account_messages_select_own" on account_messages;
drop policy if exists "account_messages_select_admin" on account_messages;
create policy "account_messages_select_own_or_admin" on account_messages
  for select using ((select auth.uid()) = account_id or (select private.is_admin()));

drop policy if exists "account_messages_insert_own" on account_messages;
drop policy if exists "account_messages_insert_admin" on account_messages;
create policy "account_messages_insert_own_or_admin" on account_messages
  for insert with check ((select auth.uid()) = account_id or (select private.is_admin()));
