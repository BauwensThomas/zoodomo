-- 0020_account_messages_avis_demande_kind.sql : nouveau type de message "demande d'avis"
-- (étoiles), distinct de "admin" : contrairement à tous les autres types de message, celui-ci
-- est rendu dynamiquement (sujet/corps + lien de vote recalculés à chaque affichage dans la
-- langue ACTUELLE du compte, pas figés dans la langue du compte au moment de l'envoi), décision
-- utilisateur explicite du 2026-08-25 après avoir remarqué qu'un changement de langue après
-- réception ne retraduisait pas le message. `subject`/`body` stockés à l'envoi restent une
-- valeur de repli raisonnable (colonnes NOT NULL), jamais affichés tels quels pour ce type.
alter table account_messages drop constraint account_messages_kind_check;
alter table account_messages add constraint account_messages_kind_check
  check (kind in ('bienvenue', 'rappel_fiche', 'essai_gratuit', 'essai_rappel_4j', 'essai_rappel_1j', 'admin', 'avis_demande'));
