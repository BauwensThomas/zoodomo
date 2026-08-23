-- Mode sombre pour l'espace membre : préférence enregistrée sur le compte pour suivre le
-- pro d'un appareil à l'autre, même principe que "langue_interface" (0001_init.sql). Valeurs
-- attendues : 'light' | 'dark' | null (null = suit la préférence système, comme le cookie
-- THEME_PREFERENCE déjà utilisé pour les visiteurs non connectés/pages hors espace membre).
alter table accounts add column theme_preference text;
