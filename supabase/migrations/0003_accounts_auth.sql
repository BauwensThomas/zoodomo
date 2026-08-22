-- 0003_accounts_auth.sql : prépare `accounts` pour la vraie authentification Supabase Auth
-- (voir docs/DECISIONS.md, 2026-08-22). Remplace le suivi maison de la vérification d'email
-- (`email_verifie`/`verification_token`) par le suivi natif de Supabase Auth
-- (`auth.users.email_confirmed_at`), et ouvre l'accès en lecture/écriture à son propre compte.

alter table accounts drop column if exists email_verifie;
alter table accounts drop column if exists verification_token;

-- Un compte connecté peut lire et modifier sa propre ligne, jamais celle d'un autre
-- (`auth.uid()` = identifiant du compte connecté, posé par Supabase Auth). Pas de policy
-- d'INSERT ici : la ligne est créée côté serveur avec le client `service_role`, juste après
-- `supabase.auth.signUp()` (voir `src/app/signup-actions.ts`), jamais directement par le client.
create policy "accounts_select_own" on accounts
  for select using (auth.uid() = id);

create policy "accounts_update_own" on accounts
  for update using (auth.uid() = id);

grant select, update on accounts to authenticated;
