-- 0001_init.sql : premières tables Zoodomo, à partir du schéma documenté dans
-- docs/BRIEF-COMPLET-SAAS-ANIMAUX.md section 5 (synchronisé le 2026-08-22).
-- RLS activé automatiquement sur chaque table (event trigger "Enable automatic RLS" réglé à
-- la création du projet), aucune policy encore écrite à ce stade : l'app continue d'utiliser
-- le store mocké pour l'instant, ces tables existent en base pour la suite du chantier
-- (migration de l'auth, puis écriture des policies, puis bascule réelle de l'app dessus).

create table accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  nom_affichage text not null,
  slug text unique not null,
  contact_email_public text,
  contact_telephone_public text,
  adresse text,
  adresse_visible boolean not null default true,
  numero_entreprise text,
  numero_entreprise_visible boolean not null default true,
  a_propos jsonb not null default '{}',
  langues_actives text[] not null default '{}',
  langue_interface text,
  email_verifie boolean not null default false,
  verification_token text,
  plan text not null default 'essai' check (plan in ('essai', 'mensuel', 'annuel')),
  created_at timestamptz default now()
);

create table account_theme (
  account_id uuid primary key references accounts(id) on delete cascade,
  police text default 'default',
  couleur_primaire text default '#000000',
  couleur_secondaire text default '#ffffff',
  disposition_photos text default 'grille' check (disposition_photos in ('grille', 'empilee', 'alternee')),
  disposition_especes text default 'liste' check (disposition_especes in ('liste', 'cote_a_cote', 'vitrine')),
  disposition_presentation text default 'texte_photos' check (disposition_presentation in ('texte_photos', 'photo_texte', 'texte_photo')),
  logo_url text,
  lien_retour_site text,
  updated_at timestamptz default now()
);

create table especes (
  id uuid primary key default gen_random_uuid(),
  nom text unique not null,
  slug text unique not null,
  ordre integer default 0
);

create table animaux (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  nom text not null,
  espece_id uuid references especes(id) not null,
  race text,
  sexe text check (sexe in ('male', 'femelle')),
  sterilise boolean,
  annee_naissance integer,
  date_naissance date,
  numero_identification text,
  date_arrivee date,
  origine text,
  description jsonb not null default '{}',
  foyer_ideal jsonb not null default '{}',
  contact_email text,
  contact_telephone text,
  prix numeric,
  statut text not null default 'disponible' check (statut in ('disponible', 'reserve', 'adopte')),
  date_adoption timestamptz,
  date_reservation timestamptz,
  slug text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table animal_badges (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animaux(id) on delete cascade,
  type text not null check (type in ('senior', 'sos', 'coeur_patient', 'adoptant_expert', 'autre')),
  label text not null,
  ordre integer default 0
);

create table account_photos (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  url text not null,
  ordre integer default 0,
  created_at timestamptz default now()
);

create table animal_photos (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animaux(id) on delete cascade,
  url text not null,
  ordre integer default 0
);

create table animal_views (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animaux(id) on delete cascade,
  viewed_at timestamptz default now()
);

create table account_messages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  kind text not null check (kind in ('bienvenue', 'rappel_fiche', 'essai_gratuit', 'essai_rappel_4j', 'essai_rappel_1j', 'admin')),
  subject text not null,
  body text not null,
  animal_id uuid references animaux(id) on delete set null,
  read boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived', 'trash')),
  created_at timestamptz default now()
);

create table support_messages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  reason text not null check (reason in ('bug', 'compte', 'suggestion', 'autre')),
  subject text not null,
  body text not null,
  photo_url text,
  read boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived', 'trash')),
  created_at timestamptz default now()
);

-- Référentiel espèces, prérempli (docs/BRIEF-COMPLET-SAAS-ANIMAUX.md section 5,
-- src/lib/mock/especes.ts pour la liste de référence côté app)
insert into especes (nom, slug, ordre) values
  ('Chien', 'chien', 1),
  ('Chat', 'chat', 2),
  ('Lapin', 'lapin', 3),
  ('Cochon d''Inde', 'cochon-dinde', 4),
  ('Hamster', 'hamster', 5),
  ('Furet', 'furet', 6),
  ('Rat / souris', 'rat-souris', 7),
  ('Chinchilla', 'chinchilla', 8),
  ('Gerbille', 'gerbille', 9),
  ('Oiseau', 'oiseau', 10),
  ('Tortue', 'tortue', 11),
  ('Serpent', 'serpent', 12),
  ('Lézard', 'lezard', 13),
  ('Poisson', 'poisson', 14),
  ('Cheval / poney / âne', 'cheval', 15),
  ('Chèvre', 'chevre', 16),
  ('Mouton', 'mouton', 17),
  ('Cochon', 'cochon', 18),
  ('Poule / coq', 'poule-coq', 19);
