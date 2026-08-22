-- 0002_service_role_grants.sql : accorde à service_role les privilèges standards que
-- Supabase donne d'habitude automatiquement à la création d'une table, mais qu'on a
-- explicitement désactivés à la création du projet ("Automatically expose new tables"
-- décoché, voir docs/DECISIONS.md) pour ne pas exposer anon/authenticated par défaut.
-- service_role reste la clé "admin" serveur uniquement (contourne RLS) : sans ce GRANT elle
-- ne peut même pas passer par l'API REST (le contournement de RLS ne dispense pas des
-- privilèges SQL standards). anon/authenticated ne sont volontairement PAS touchés ici :
-- chaque table sera exposée au public une par une, avec sa policy RLS, à une étape séparée.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Pour que les prochaines tables créées (migrations suivantes) héritent automatiquement
-- des mêmes privilèges, sans avoir à répéter ce script à chaque fois.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
