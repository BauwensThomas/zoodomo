-- Corrige le dernier item du Security Advisor Supabase (rls_enabled_no_policy) :
-- `especes` a RLS activé (comme toutes les tables, via l'event trigger `rls_auto_enable`)
-- mais n'a jamais eu de policy, et n'a même pas de GRANT SELECT pour anon/authenticated
-- (seul service_role peut la lire). En pratique sans risque : l'app résout les espèces
-- depuis une liste statique en mémoire (`src/lib/mock/especes.ts`), jamais par une requête
-- directe sur cette table. Mais l'état "RLS activé sans policy" reste ambigu et signalé, et
-- ce référentiel (noms/slugs d'espèces) n'a rien de sensible : ouvert en lecture publique
-- plutôt que de laisser une table bloquée sans raison fonctionnelle.
grant select on especes to anon, authenticated;

create policy "especes_select_all" on especes
  for select using (true);
