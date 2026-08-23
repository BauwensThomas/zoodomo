-- Oubli de la migration précédente (0012_advisor_fixes.sql) : `account_id` était déjà
-- couvert par les index uniques composites existants (account_id en tête), mais `animal_id`
-- n'apparaît qu'en position secondaire dans l'un d'eux, donc pas réellement "couvrant" pour
-- ce fkey. Confirmé par le Performance Advisor Supabase (unindexed_foreign_keys), pas
-- seulement supposé.
create index if not exists idx_account_message_log_animal_id on account_message_log (animal_id);
