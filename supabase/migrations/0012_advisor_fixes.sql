-- Corrige les recommandations du Performance Advisor Supabase (26 warnings + 8 des 9 info),
-- vérifiées par requête directe sur pg_policies/information_schema le 2026-08-23, avant
-- d'appliquer quoi que ce soit : voir docs/DECISIONS.md.

-- 1. "Auth RLS Initialization Plan" (26 policies) : `auth.uid()` appelé directement dans une
-- condition RLS est réévalué par Postgres à chaque ligne scannée. Enveloppé dans un
-- sous-select, il n'est évalué qu'une seule fois par requête (le planificateur le traite
-- comme une valeur constante). Comportement fonctionnel strictement identique, seule la
-- vitesse change.

alter policy "account_message_log_select_own" on account_message_log
  using ((select auth.uid()) = account_id);
alter policy "account_message_log_insert_own" on account_message_log
  with check ((select auth.uid()) = account_id);

alter policy "account_messages_select_own" on account_messages
  using ((select auth.uid()) = account_id);
alter policy "account_messages_insert_own" on account_messages
  with check ((select auth.uid()) = account_id);
alter policy "account_messages_update_own" on account_messages
  using ((select auth.uid()) = account_id);
alter policy "account_messages_delete_own" on account_messages
  using ((select auth.uid()) = account_id);

alter policy "account_photos_select_own" on account_photos
  using ((select auth.uid()) = account_id);
alter policy "account_photos_insert_own" on account_photos
  with check ((select auth.uid()) = account_id);
alter policy "account_photos_delete_own" on account_photos
  using ((select auth.uid()) = account_id);

alter policy "account_theme_select_own" on account_theme
  using ((select auth.uid()) = account_id);
alter policy "account_theme_update_own" on account_theme
  using ((select auth.uid()) = account_id);

alter policy "accounts_select_own" on accounts
  using ((select auth.uid()) = id);
alter policy "accounts_update_own" on accounts
  using ((select auth.uid()) = id);

alter policy "animal_badges_select_own" on animal_badges
  using (exists (select 1 from animaux where animaux.id = animal_badges.animal_id and animaux.account_id = (select auth.uid())));
alter policy "animal_badges_insert_own" on animal_badges
  with check (exists (select 1 from animaux where animaux.id = animal_badges.animal_id and animaux.account_id = (select auth.uid())));
alter policy "animal_badges_delete_own" on animal_badges
  using (exists (select 1 from animaux where animaux.id = animal_badges.animal_id and animaux.account_id = (select auth.uid())));

alter policy "animal_photos_select_own" on animal_photos
  using (exists (select 1 from animaux where animaux.id = animal_photos.animal_id and animaux.account_id = (select auth.uid())));
alter policy "animal_photos_insert_own" on animal_photos
  with check (exists (select 1 from animaux where animaux.id = animal_photos.animal_id and animaux.account_id = (select auth.uid())));
alter policy "animal_photos_delete_own" on animal_photos
  using (exists (select 1 from animaux where animaux.id = animal_photos.animal_id and animaux.account_id = (select auth.uid())));

alter policy "animal_views_select_own" on animal_views
  using (exists (select 1 from animaux where animaux.id = animal_views.animal_id and animaux.account_id = (select auth.uid())));

alter policy "animaux_select_own" on animaux
  using ((select auth.uid()) = account_id);
alter policy "animaux_insert_own" on animaux
  with check ((select auth.uid()) = account_id);
alter policy "animaux_update_own" on animaux
  using ((select auth.uid()) = account_id);
alter policy "animaux_delete_own" on animaux
  using ((select auth.uid()) = account_id);

alter policy "support_messages_select_own" on support_messages
  using ((select auth.uid()) = account_id);
alter policy "support_messages_insert_own" on support_messages
  with check ((select auth.uid()) = account_id);

-- 2. "Unindexed foreign keys" (8 des 9 info) : colonnes de clé étrangère sans index, gênant
-- pour les jointures RLS ci-dessus (chacune interroge `animaux` par `account_id`/`id`) et pour
-- les suppressions en cascade (`on delete cascade` déjà en place sur ces clés).
create index if not exists idx_account_messages_account_id on account_messages (account_id);
create index if not exists idx_account_messages_animal_id on account_messages (animal_id);
create index if not exists idx_account_photos_account_id on account_photos (account_id);
create index if not exists idx_animal_badges_animal_id on animal_badges (animal_id);
create index if not exists idx_animal_photos_animal_id on animal_photos (animal_id);
create index if not exists idx_animal_views_animal_id on animal_views (animal_id);
create index if not exists idx_animaux_espece_id on animaux (espece_id);
create index if not exists idx_support_messages_account_id on support_messages (account_id);
