-- 0007_account_messages_delete.sql : `account_messages` avait select/insert/update
-- (0005_full_data_rls.sql) mais pas de policy de delete, alors que "Supprimer
-- définitivement" depuis la corbeille (`deleteMessageAction`, `src/app/espace/actions.ts`)
-- en a besoin : RLS bloquait silencieusement la suppression (0 ligne affectée, pas d'erreur
-- levée par Supabase), le bouton semblait ne rien faire. Bug réel remonté par l'utilisateur,
-- voir docs/DECISIONS.md.
create policy "account_messages_delete_own" on account_messages
  for delete using (auth.uid() = account_id);

grant delete on account_messages to authenticated;
