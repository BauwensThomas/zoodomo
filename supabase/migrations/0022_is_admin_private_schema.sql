-- 0022_is_admin_private_schema.sql : `is_admin()` vivait dans `public` (schéma exposé par
-- l'API REST), donc appelable directement via `/rest/v1/rpc/is_admin` par n'importe qui
-- (anon compris, malgré `security definer`), signalé par le Security Advisor
-- (anon_security_definer_function_executable / authenticated_security_definer_function_executable,
-- 2026-08-27). `authenticated` doit garder le droit de l'exécuter (utilisée dans plusieurs
-- règles RLS, `supabase/migrations/0016_admin_role.sql`, évaluées dans le contexte de ce
-- rôle) : pas question de simplement révoquer son accès, contrairement au cas de
-- `rls_auto_enable` (migration 0014), qui n'était appelée que par le mécanisme d'event
-- trigger lui-même. La bonne correction, recommandée par Supabase lui-même : déplacer la
-- fonction hors des schémas exposés par l'API REST (`public`/`graphql_public`), qui ne
-- casse rien côté RLS (Postgres résout la fonction par son identité, pas par une
-- recherche textuelle dépendant du schéma), tout en la rendant définitivement injoignable
-- depuis l'extérieur.
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

alter function public.is_admin() set schema private;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, service_role;
