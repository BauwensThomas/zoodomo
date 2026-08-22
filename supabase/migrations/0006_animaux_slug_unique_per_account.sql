-- 0006_animaux_slug_unique_per_account.sql : `animaux.slug` était unique sur toute la table
-- (`animaux_slug_key`), jamais un problème tant que l'app tournait sur le store mocké (les
-- vraies contraintes SQL n'étaient jamais réellement testées), mais bloquant maintenant que
-- les écritures passent pour de vrai par Supabase : deux comptes différents ayant chacun un
-- animal nommé pareil (ex. deux refuges avec un chat "Minou") entreraient en conflit alors
-- que l'app ne calcule l'unicité du slug que par compte (`uniqueSlug`, voir
-- src/lib/mock/store.ts). Remplacée par une contrainte unique composite (account_id, slug),
-- qui correspond à ce que l'app a toujours réellement voulu garantir : l'URL publique
-- `/[compte]/[espece]/[slug]` n'a besoin d'être unique que dans un même compte.
alter table animaux drop constraint animaux_slug_key;
alter table animaux add constraint animaux_account_id_slug_key unique (account_id, slug);
