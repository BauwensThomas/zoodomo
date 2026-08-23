-- Corrige 2 des 3 warnings du Security Advisor Supabase
-- (anon_security_definer_function_executable, authenticated_security_definer_function_executable) :
-- `rls_auto_enable()` (event trigger géré par Supabase, active RLS automatiquement sur les
-- nouvelles tables, voir DECISIONS.md 2026-08-22) est SECURITY DEFINER et avait `EXECUTE`
-- accordé à PUBLIC par défaut (comportement standard de Postgres à la création d'une
-- fonction), la rendant appelable sans authentification via /rest/v1/rpc/rls_auto_enable.
-- Cette fonction n'est censée être invoquée que par le mécanisme d'event trigger lui-même
-- (déclenché en interne à chaque CREATE TABLE, indépendant des droits EXECUTE d'un rôle),
-- jamais par un appel direct via l'API : retirer EXECUTE à PUBLIC/anon/authenticated ne
-- change rien à son fonctionnement, seulement à son exposition externe.
revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;

-- 3e warning (auth_leaked_password_protection) laissé tel quel, décision utilisateur : cette
-- protection nécessite le plan payant Supabase, indisponible sur le plan gratuit actuel.
