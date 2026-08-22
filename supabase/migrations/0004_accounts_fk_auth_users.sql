-- 0004_accounts_fk_auth_users.sql : `accounts.id` doit vraiment référencer `auth.users(id)`,
-- pas juste par convention côté code (`signupAction` pose `id: data.user.id`, voir
-- src/app/signup-actions.ts). Sans cette contrainte, supprimer un utilisateur Supabase Auth
-- ne supprime pas sa ligne de profil (orpheline). `on delete cascade` : supprimer le compte
-- Auth supprime aussi son profil, cohérent avec le reste du schéma (`animaux`, etc. déjà en
-- cascade sur `account_id`).
alter table accounts
  add constraint accounts_id_fkey foreign key (id) references auth.users(id) on delete cascade;
