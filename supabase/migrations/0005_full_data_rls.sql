-- 0005_full_data_rls.sql : ouvre l'accès (policies RLS + grants) aux tables restées sans
-- policy depuis 0001_init.sql, pour migrer le reste de l'app (thème, photos, animaux,
-- messages) du store mocké en mémoire vers ces vraies tables. Voir docs/DECISIONS.md.
--
-- Convention : un compte connecté (`auth.uid()`) ne voit/modifie que ses propres lignes,
-- même principe que `accounts_select_own`/`accounts_update_own` (0003_accounts_auth.sql).
-- Les pages publiques (visiteurs anonymes) et le panneau admin (auth maison, pas de session
-- Supabase Auth) passent par le client `service_role` côté serveur, qui contourne RLS : ils
-- n'ont donc pas besoin de policy dédiée ici.

-- account_theme : une ligne par compte, créée par défaut à l'inscription (voir
-- src/app/signup-actions.ts) via le client service_role, jamais par le client authentifié :
-- pas de policy d'insert ici, seulement select/update.
create policy "account_theme_select_own" on account_theme
  for select using (auth.uid() = account_id);

create policy "account_theme_update_own" on account_theme
  for update using (auth.uid() = account_id);

grant select, update on account_theme to authenticated;

-- Comptes réels créés avant ce correctif (dont ils n'ont donc pas encore de ligne
-- account_theme) : backfill pour qu'ils puissent enregistrer Compte/Personnalisation sans
-- attendre une réinscription.
insert into account_theme (account_id)
select id from accounts where id not in (select account_id from account_theme);

-- account_photos : la page Compte remplace toute la liste à chaque enregistrement
-- (supprime puis réinsère), pas de policy d'update nécessaire.
create policy "account_photos_select_own" on account_photos
  for select using (auth.uid() = account_id);

create policy "account_photos_insert_own" on account_photos
  for insert with check (auth.uid() = account_id);

create policy "account_photos_delete_own" on account_photos
  for delete using (auth.uid() = account_id);

grant select, insert, delete on account_photos to authenticated;

-- animaux : CRUD complet sur ses propres fiches.
create policy "animaux_select_own" on animaux
  for select using (auth.uid() = account_id);

create policy "animaux_insert_own" on animaux
  for insert with check (auth.uid() = account_id);

create policy "animaux_update_own" on animaux
  for update using (auth.uid() = account_id);

create policy "animaux_delete_own" on animaux
  for delete using (auth.uid() = account_id);

grant select, insert, update, delete on animaux to authenticated;

-- animal_photos / animal_badges : pas de colonne account_id directe, policy via une
-- sous-requête jointe sur animaux (même principe que ci-dessus, un niveau plus loin).
create policy "animal_photos_select_own" on animal_photos
  for select using (exists (
    select 1 from animaux where animaux.id = animal_photos.animal_id and animaux.account_id = auth.uid()
  ));

create policy "animal_photos_insert_own" on animal_photos
  for insert with check (exists (
    select 1 from animaux where animaux.id = animal_photos.animal_id and animaux.account_id = auth.uid()
  ));

create policy "animal_photos_delete_own" on animal_photos
  for delete using (exists (
    select 1 from animaux where animaux.id = animal_photos.animal_id and animaux.account_id = auth.uid()
  ));

grant select, insert, delete on animal_photos to authenticated;

create policy "animal_badges_select_own" on animal_badges
  for select using (exists (
    select 1 from animaux where animaux.id = animal_badges.animal_id and animaux.account_id = auth.uid()
  ));

create policy "animal_badges_insert_own" on animal_badges
  for insert with check (exists (
    select 1 from animaux where animaux.id = animal_badges.animal_id and animaux.account_id = auth.uid()
  ));

create policy "animal_badges_delete_own" on animal_badges
  for delete using (exists (
    select 1 from animaux where animaux.id = animal_badges.animal_id and animaux.account_id = auth.uid()
  ));

grant select, insert, delete on animal_badges to authenticated;

-- animal_views : lecture seule pour le compte propriétaire (page Statistiques). L'écriture
-- (une vue enregistrée à chaque affichage public d'une fiche) vient d'un visiteur anonyme,
-- via le client service_role : pas de policy d'insert pour authenticated.
create policy "animal_views_select_own" on animal_views
  for select using (exists (
    select 1 from animaux where animaux.id = animal_views.animal_id and animaux.account_id = auth.uid()
  ));

grant select on animal_views to authenticated;

-- account_messages : le compte lit/marque lu/archive/corbeille ses propres messages.
-- L'insert sert aux messages automatiques (bienvenue, rappels d'essai, fiche périmée),
-- générés dans le contexte du compte connecté (src/app/espace/layout.tsx) : le compte
-- s'insère bien un message à lui-même, auth.uid() = account_id tient.
create policy "account_messages_select_own" on account_messages
  for select using (auth.uid() = account_id);

create policy "account_messages_insert_own" on account_messages
  for insert with check (auth.uid() = account_id);

create policy "account_messages_update_own" on account_messages
  for update using (auth.uid() = account_id);

grant select, insert, update on account_messages to authenticated;

-- support_messages : le compte peut envoyer un message au support ("contacter le
-- webmaster"), mais ne relit/ne traite jamais ces messages ensuite (seul l'admin le fait,
-- via le client service_role) : insert uniquement.
create policy "support_messages_insert_own" on support_messages
  for insert with check (auth.uid() = account_id);

grant insert on support_messages to authenticated;
