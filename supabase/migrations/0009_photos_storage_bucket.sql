-- 0009_photos_storage_bucket.sql : bucket Supabase Storage unique pour toutes les photos
-- publiques (présentation de compte, animaux, logo), remplace le stockage en data: URL
-- directement dans les colonnes `url`/`logo_url`. Voir docs/DECISIONS.md.
--
-- Un seul bucket public, chemin préfixé par account_id (= auth.uid(), voir
-- 0004_accounts_fk_auth_users.sql) : `{account_id}/account/...`, `{account_id}/animals/...`,
-- `{account_id}/logo/...`. `public = true` => lecture publique sans policy (mêmes photos
-- déjà servies sans authentification sur /[compte] etc.), seuls insert/delete sont
-- restreints au propriétaire via RLS sur storage.objects. `file_size_limit`/
-- `allowed_mime_types` en défense en profondeur : les photos compressées côté client
-- (PhotoUploadField.tsx) font quelques centaines de Ko en JPEG, jamais plus.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;
-- `image/png` ajouté après coup : PhotoUploadField.tsx réencode toujours en JPEG (voir son
-- propre commentaire), mais un logo seedé directement en base par un script d'administration
-- (pas par le formulaire réel) peut rester en PNG d'origine, sans repasser par le canvas de
-- compression. Élargi plutôt que de forcer une conversion pour ce cas ponctuel.

-- Le premier segment du chemin doit correspondre au compte connecté : même principe que
-- accounts_id_fkey / auth.uid() = account_id ailleurs (0005_full_data_rls.sql), transposé
-- à storage.objects.name via storage.foldername(). Pas de policy d'update : les uploads
-- utilisent toujours un nom de fichier neuf (uuid), jamais réécrits en place.
--
-- La policy select est nécessaire même si le bucket est public : la lecture publique passe
-- par une route dédiée (/object/public/...) qui contourne RLS, mais l'API de gestion
-- authentifiée (utilisée par .remove()/.list() depuis le navigateur, PhotoUploadField.tsx)
-- doit d'abord "voir" une ligne via select pour pouvoir la supprimer. Sans cette policy,
-- .remove() renvoie silencieusement un tableau vide (aucune erreur), constaté et corrigé en
-- testant réellement le nettoyage d'une photo retirée, voir docs/DECISIONS.md.
create policy "photos_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

grant select, insert, delete on storage.objects to authenticated;
