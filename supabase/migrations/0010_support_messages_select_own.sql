-- Jusqu'ici, "support_messages" n'avait qu'une policy insert-only (le pro envoie un message
-- au webmaster mais ne le relit jamais, seul l'admin le fait via le client service_role, voir
-- 0005_full_data_rls.sql). Nouvel onglet "Envoyés" côté pro (`/espace/messages?view=envoyes`,
-- lecture seule de ses propres messages) : nécessite qu'il puisse relire ses propres lignes.
create policy "support_messages_select_own" on support_messages
  for select using (auth.uid() = account_id);

grant select on support_messages to authenticated;
