# Brief complet — Zoodomo, SaaS de fiches animaux pour refuges & vendeurs pro

## 1. Vision produit

**Zoodomo** est un outil qui évite aux refuges animaliers et vendeurs professionnels de coder eux-mêmes une présentation web pour leurs animaux. Le principe : le refuge entre toutes ses infos (animaux, photos, description) dans son espace membre Zoodomo, puis récupère un **lien direct par espèce** (ex: `zoodomo.com/refuge-x/adoption`) à placer comme bouton ou lien de menu sur son propre site (`refuge.com`). En cliquant sur "Adoption" sur `refuge.com`, le visiteur est redirigé vers la page Zoodomo correspondante, qui affiche la galerie complète des animaux disponibles de cette espèce.

Concrètement, c'est un simple lien externe, comme un refuge qui renvoie vers sa page Facebook ou ses avis Google — le refuge n'a rien à coder, juste à mettre à jour un lien de menu ou un bouton sur son site existant. L'esprit général : l'utilisateur n'a **aucune connaissance technique**, comme s'il utilisait un générateur de site sans code — il choisit ses options (couleurs, police, disposition), et le résultat est garanti propre et responsive sur tous les écrans, sans réglage supplémentaire de sa part.

**Problème résolu** : les refuges/vendeurs pro n'ont ni le temps ni les compétences pour développer eux-mêmes une section "animaux disponibles" sur leur site, et les logiciels de gestion de refuge existants (Refugilys, Chameleon-CMS, The Pet Friend) sont des outils lourds de gestion administrative/médicale — pas centrés sur la présentation publique. Zoodomo comble ce vide : rapide, spécialisé, et se relie facilement au site déjà existant du client via un simple lien.

**Modèle économique** : abonnement mensuel (SaaS B2B).

**Cible MVP** : vendeurs de chiens pour qui c'est une activité professionnelle (gros volume, plusieurs portées/an) et refuges animaliers (plusieurs animaux en permanence), qui ont déjà (ou veulent) un site web propre. Pas les particuliers qui vendent une portée occasionnelle.

## 2. Utilisateurs et accès

- **Un seul type de compte pour le MVP** (pas de distinction de rôle refuge/vendeur au départ — même fonctionnalités pour tous).
- Le compte est protégé par login (email/mot de passe ou OAuth).
- Le **contenu public (galeries et fiches) est accessible sans compte**, via les liens directs générés par Zoodomo, destinés à être placés comme lien de menu/bouton sur le site du refuge, partagés sur Facebook/WhatsApp, ou imprimés en QR code.
- Un utilisateur peut gérer plusieurs fiches animaux sous un seul compte.

## 3. Fonctionnalités principales

### Champs d'une annonce (fiche animal)

Structure inspirée de refuges pro établis (ex: SRPA Veeweyde) pour couvrir ce qu'un adoptant/acheteur a besoin de savoir :

- **Identité** : nom, espèce + race/sous-espèce, sexe, statut de stérilisation (affiché combiné, ex: "Mâle castré" / "Femelle non stérilisée"), année de naissance
- **Traçabilité** : numéro d'identification (puce), date d'arrivée au refuge, origine (pays/région)
- **Présentation** : description libre, section "Foyer idéal" en liste à puces (compatibilité enfants, besoin de jardin, autres animaux, etc.)
- **Badges/étiquettes** : marqueurs visuels sur la fiche et dans la galerie, ex: "Senior", "SOS" (urgence de placement), "Cœur patient depuis [année]" (animal en attente depuis longtemps), "Adoptant expert" (profil expérimenté requis) — extensible, le compte peut ajouter ses propres badges
- **Statut/prix** : disponible / réservé / adopté, et frais d'adoption ou prix de vente selon le contexte
- **Photos** : plusieurs par animal
- **Contact** : bouton "Contactez-nous" **obligatoire sur chaque annonce, sans exception** — utilise en priorité le contact spécifique de l'animal s'il existe, sinon retombe automatiquement sur le contact générique du compte (section 3, "Contact générique du compte"). Une fiche ne peut jamais être publiée sans qu'un moyen de contact soit affiché. Peut prendre la forme d'un lien `tel:`/`mailto:` direct (comme "Contactez-nous: 02/527.10.50" chez Veeweyde) ou d'un mini formulaire, au choix dans la config du compte.

### Espace membre (privé, après connexion)
- **Dashboard** listant toutes les fiches animaux du compte, avec aperçu et statut (publiée/brouillon).
- **Création/édition de fiche animal** : tous les champs détaillés ci-dessous (section "Champs d'une annonce"), avec upload multiple de photos.
- **Statistiques par fiche** : nombre de vues, évolution dans le temps, source du trafic si possible (simple pour le MVP : compteur de vues + graphe basique).
- **Partage** : génération du lien public direct par espèce + QR code téléchargeable, à placer par le refuge comme lien de menu/bouton sur son propre site ou à partager sur les réseaux.
- **Personnalisation visuelle** (onglet dédié) : voir détail ci-dessous. Cette personnalisation s'applique à l'ensemble des pages publiques du compte (identité visuelle du refuge/vendeur), pas fiche par fiche.

### Onglet personnalisation — détail des options

- **Police d'écriture** : choix parmi une sélection de polices web (ex: 4-6 polices lisibles, dont une classique/sérieuse et une plus moderne/arrondie).
- **Couleurs** : couleur primaire + couleur secondaire (palette libre via sélecteur de couleur), appliquées aux boutons, titres, fonds.
- **Logo** : upload du logo du refuge/vendeur, affiché en en-tête de chaque page publique (galerie et fiche), pour que le visiteur reconnaisse bien qu'il est toujours "chez" le refuge même sur le domaine Zoodomo.
- **Lien de retour vers le site du refuge** : champ URL configurable, affiché comme bouton/lien visible sur chaque page publique (ex: "Retour sur notre site" ou nom du refuge cliquable), pour permettre au visiteur de revenir facilement sur `refuge.com` après avoir consulté les animaux.
- **Disposition de la galerie** (liste des animaux) — plusieurs mises en page au choix :
  - **Grille/cadre** : photos en cartes alignées, plusieurs par ligne (le plus classique, dense).
  - **Empilée** : une fiche animal par ligne, l'une en dessous de l'autre (photo + infos côte à côte dans la ligne), plus lisible sur mobile ou pour peu d'animaux.
  - **Alternée gauche-droite** : les fiches empilées alternent photo à gauche/texte à droite, puis photo à droite/texte à gauche, pour un rendu plus dynamique façon page d'atterrissage.
  - **Carrousel** : les animaux défilent horizontalement, un ou quelques-uns visibles à la fois.
- Le choix de disposition s'applique à la galerie d'espèce ; la fiche animal individuelle garde une mise en page détaillée fixe (photos + infos), mais hérite des couleurs/police du compte.
- **Responsive obligatoire, sans réglage supplémentaire côté utilisateur** : le refuge n'a aucune connaissance technique, donc chaque disposition (grille, empilée, alternée, carrousel) doit s'adapter automatiquement à l'écran (desktop, tablette, mobile) sans qu'il ait à configurer quoi que ce soit — exactement comme un vrai générateur de site clé en main (type Wix/Squarespace), où l'utilisateur choisit un style et le rendu est garanti correct partout. Par exemple, la disposition "alternée gauche-droite" doit basculer automatiquement en colonne unique empilée sur mobile plutôt que de rester en 2 colonnes illisibles.
- **Photos de présentation du compte** : en plus des photos par animal, le compte peut uploader plusieurs photos générales (locaux, équipe, ambiance du refuge/de l'activité) pour compléter sa présentation publique — affichées sur la page d'index du compte (`/[compte]`).

### Compression et gestion des images

Toutes les images uploadées (animaux et photos du compte) doivent être **compressées au maximum** avant stockage définitif, pour limiter le poids Storage et accélérer le chargement des pages publiques :
- Compression + redimensionnement côté client avant upload (ex: `browser-image-compression`) pour réduire la bande passante et le temps d'attente utilisateur.
- Génération d'un format optimisé pour le web (WebP en priorité, fallback JPEG si besoin) avec plusieurs tailles si pertinent (miniature pour les grilles, taille intermédiaire pour la fiche détaillée) — évite de charger une image pleine résolution inutilement.
- Limite de taille et de nombre de fichiers par upload, avec message clair si dépassement.
- Le mirror Storage du backup (section 10) doit tenir compte de ce nouveau bucket `account_photos` en plus de `animal_photos`.

### Diffusion publique — lien direct par espèce

Le contenu public (galeries par espèce, fiches animaux) est hébergé sur Zoodomo et accessible via une **URL directe par espèce** (`zoodomo.com/[compte]/[espece]`), que le refuge place comme lien de menu ou bouton sur son propre site (ex: le lien "Adoption" de `refuge.com` pointe directement vers `zoodomo.com/refuge-x/chiens`). En cliquant, le visiteur est redirigé sur la page Zoodomo, habillée avec le thème visuel du compte (police/couleurs définies dans l'onglet personnalisation), pour rester cohérente avec l'identité du refuge même si le domaine change.

Ce même lien peut aussi être utilisé tel quel pour un post Facebook, un QR code imprimé, ou partagé par WhatsApp — un seul lien, plusieurs usages.

Pas de page intermédiaire demandant au visiteur de choisir son espèce — ce type d'étape est une friction inutile pour quelqu'un qui arrive déjà avec une intention précise (ex: "voir les chats disponibles"). Chaque espèce a directement sa propre galerie et son propre lien, à placer où le refuge le souhaite sur son site.

Si un visiteur atterrit sur `/[compte]` sans passer par une espèce précise (lien générique du compte, cas secondaire), la page liste simplement les galeries disponibles sous forme de liens clairs.

### Fonctionnalités complémentaires

- **Contact générique du compte** : en plus du contact spécifique par fiche animal, un email/téléphone de contact général au niveau du compte, affiché sur les pages publiques (utile si un visiteur a une question générale plutôt que sur un animal précis).
- **Galerie vide propre** : si une espèce n'a temporairement aucun animal publié, afficher un message clair ("Aucun animal disponible pour le moment, revenez bientôt !") plutôt qu'une page vide ou cassée — évite une mauvaise impression pour le refuge.
- **Notification de fiche non mise à jour** : email automatique au compte si une fiche animal dépasse un certain nombre de jours (ex: 30) sans modification, pour rappeler de vérifier si l'animal est toujours disponible — évite les fiches obsolètes qui nuisent à la crédibilité du refuge.
- **Aperçu avant publication** : depuis l'espace membre, un bouton "voir comme un visiteur" permettant de prévisualiser le rendu réel d'une fiche/galerie avant de la publier ou de partager le lien.
- **Mention RGPD** : le formulaire de contact sur la fiche animal collecte des données personnelles du visiteur (email/téléphone) — prévoir une mention de confidentialité minimale (finalité de la collecte, durée de conservation) à côté du formulaire.
- **Export CSV** : depuis le dashboard, export des données de ses animaux (nom, espèce, statut, etc.) en CSV, pour rassurer le refuge sur la portabilité de ses données.

### Post-MVP (pas dans le scope initial)

- **Multi-collaborateurs par compte** : possibilité d'ajouter un second utilisateur (ex: bénévole) avec accès limité au même compte — utile une fois le refuge en croissance, pas bloquant pour valider le concept.
- **Landing page commerciale Zoodomo** : une vraie page de présentation/pricing du service à `zoodomo.com` (racine du domaine, séparée de l'app), pour la partie vente/acquisition — projet en soi, distinct du développement du produit.

### Fiche animal (détail)

Layout de référence (inspiré de la fiche Veeweyde) :
- **Carrousel photo** : photos de l'animal avec flèches de navigation (précédent/suivant) et indicateurs (points) en bas de l'image montrant la position dans le carrousel. Le badge (Senior/SOS/etc., voir section "Champs d'une annonce") s'affiche en incrustation dans le coin supérieur de la photo.
- **Bloc infos** à côté du carrousel (ou en dessous sur mobile) : nom de l'animal en titre, puis les champs d'identité en deux colonnes (race, sexe, numéro d'identification, date d'arrivée, origine, etc.).
- **Bouton "Contactez-nous"** bien visible sous le bloc infos, dans la couleur primaire du thème du compte.
- **Description** en texte libre sous le bloc photo/infos, suivie de la section "Foyer idéal" en liste à puces si renseignée.
- **Lien "retour à la galerie"** vers la page de l'espèce correspondante.

Ce layout doit rester lisible et bien agencé en version mobile (bloc infos qui passe sous le carrousel plutôt qu'à côté, voir exigence responsive de la section personnalisation).

## 4. UX — Navigation par onglets horizontaux (SPA-like)

Exigence UX forte : l'espace membre doit utiliser une **navigation par onglets horizontaux façon ancienne application**, où l'utilisateur change de section (Dashboard / Mes fiches / Statistiques / Personnalisation / Compte) **sans jamais avoir l'impression de changer de page** — pas de rechargement visible, transition fluide, état conservé.

Techniquement, ça correspond à une architecture SPA classique :
- Un layout persistant avec la barre d'onglets horizontale fixe en haut.
- Le contenu de chaque onglet est rendu dynamiquement (changement de state / route interne) sans full page reload.
- Avec Next.js : layout partagé + routes internes (app router), transitions gérées côté client, pas de rechargement complet du `<head>`/layout à chaque clic.

## 5. Modèle de données (ébauche)

**Approche espèces** : structure hiérarchique **espèce → sous-espèce/race**, gérée via une table dédiée plutôt qu'un champ texte libre sur l'animal, pour permettre le filtrage par espèce sur la page d'accueil publique. Liste indicative de catégories à préremplir (extensible sans toucher au code) :
- Chien (races : Labrador, Berger allemand, Croisé, ... + "Autre")
- Chat (races : Européen, Siamois, Croisé, ... + "Autre")
- Lapin, Cochon d'Inde, Hamster, Furet
- Rat/souris, Chinchilla, Gerbille, Oiseau (perroquet/perruche), Tortue, Serpent, Lézard, Poisson
- Cheval/poney/âne, Chèvre, Mouton, Cochon, Poule/coq

```sql
-- Comptes utilisateurs (refuges / vendeurs)
create table accounts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  nom_affichage text not null,
  slug text unique not null, -- identifiant public du compte dans l'URL
  contact_email_public text, -- email de contact générique affiché aux visiteurs (distinct de l'email de connexion)
  contact_telephone_public text,
  created_at timestamptz default now()
);

-- Personnalisation visuelle liée au compte
create table account_theme (
  account_id uuid primary key references accounts(id) on delete cascade,
  police text default 'default',
  couleur_primaire text default '#000000',
  couleur_secondaire text default '#ffffff',
  disposition_photos text default 'grille', -- 'grille' | 'empilee' | 'alternee' | 'carrousel'
  logo_url text,
  lien_retour_site text, -- URL du site du refuge, affichée comme lien retour
  updated_at timestamptz default now()
);

-- Espèces (référentiel global, pas lié à un compte)
create table especes (
  id uuid primary key default gen_random_uuid(),
  nom text unique not null, -- ex: 'Chien', 'Chat', 'Lapin'
  slug text unique not null,
  ordre integer default 0
);

-- Sous-espèces / races (rattachées à une espèce)
create table sous_especes (
  id uuid primary key default gen_random_uuid(),
  espece_id uuid references especes(id) on delete cascade,
  nom text not null, -- ex: 'Labrador', 'Croisé', 'Autre'
  slug text not null,
  unique (espece_id, nom)
);

-- Fiches animaux
create table animaux (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  nom text not null,
  espece_id uuid references especes(id) not null,
  sous_espece_id uuid references sous_especes(id), -- race
  sexe text, -- 'male' | 'femelle'
  sterilise boolean, -- stérilisé/castré ou non — affiché combiné au sexe (ex: "Mâle castré")
  annee_naissance integer, -- juste l'année, pas de date de naissance précise
  numero_identification text, -- numéro de puce électronique
  date_arrivee date, -- date d'arrivée au refuge/chez le vendeur
  origine text, -- pays/région d'origine
  description text,
  foyer_ideal text, -- description du foyer idéal, affichée en liste à puces (texte structuré ou markdown simple)
  prix numeric, -- frais d'adoption (refuge) ou prix de vente (vendeur pro) selon le contexte du compte
  statut text default 'disponible', -- 'disponible' | 'reserve' | 'adopte'
  slug text unique not null, -- pour l'URL publique
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Badges/tags affichés sur la fiche (Senior, SOS, Cœur patient depuis..., Adoptant expert, etc.)
create table animal_badges (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animaux(id) on delete cascade,
  type text not null, -- 'senior' | 'sos' | 'coeur_patient' | 'adoptant_expert' | 'autre'
  label text not null, -- texte affiché (ex: "Cœur patient depuis 2022")
  ordre integer default 0
);

-- Photos de présentation du compte (société/refuge — locaux, équipe, ambiance)
create table account_photos (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade,
  url text not null,
  ordre integer default 0,
  created_at timestamptz default now()
);

-- Photos par animal
create table animal_photos (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animaux(id) on delete cascade,
  url text not null,
  ordre integer default 0
);

-- Statistiques de vues
create table animal_views (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid references animaux(id) on delete cascade,
  viewed_at timestamptz default now()
);
```

`especes` et `sous_especes` sont un référentiel global partagé entre tous les comptes (pas dupliqué par compte), préremplis au déploiement avec la liste indicative ci-dessus, extensible sans redéploiement (simple insertion en base).

RLS Supabase à prévoir : un `account` ne peut lire/modifier que ses propres `animaux`, `animal_photos`, `account_theme`. `especes`/`sous_especes` sont en lecture publique pour tous (nécessaire pour le sélecteur d'espèce sur les pages publiques). Les pages publiques (`/[compte]/[espece]/[slug]` pour une fiche, `/[compte]/[espece]` pour la galerie filtrée, `/[compte]` pour le choix d'espèce) lisent les animaux en lecture seule via une policy publique restreinte au statut non-brouillon.

`especes` et `sous_especes` sont préremplis au premier déploiement avec la liste indicative de la section 5.

## 6. Stack technique

- **Next.js** (App Router) + **TypeScript**
- **Supabase** : auth, base de données Postgres, storage pour les photos, RLS
- **Vercel** : hébergement/déploiement
- Upload photos : Supabase Storage, avec redimensionnement/compression avant upload
- Génération QR code : lib côté client (ex: `qrcode`)
- **Internationalisation (i18n)** : l'app doit être disponible en **français, néerlandais et anglais** dès le MVP. Utiliser une lib d'i18n Next.js standard (ex: `next-intl` ou `next-i18next`), avec détection de langue par défaut (navigateur) et sélecteur manuel. Prévoir dès le départ que tous les textes d'interface passent par les fichiers de traduction (pas de texte en dur), pour faciliter l'ajout de langues futures. Le contenu saisi par l'utilisateur (nom/description des animaux) reste dans la langue qu'il choisit, non traduit automatiquement au MVP.
- **Lien direct par espèce** : chaque page publique de galerie/fiche est une page Next.js classique servie sur le domaine Zoodomo, pas besoin de gestion d'embed cross-domain — le refuge y renvoie simplement via un lien depuis son propre site.

## 7. Structure de dossiers et gestion Git

À la racine du projet, prévoir dès l'initialisation les dossiers suivants, **tous exclus via `.gitignore`** :
- `/docs/` — tous les fichiers `.md` de documentation du projet (brief, DECISIONS.md, PROGRESS.md, ARCHITECTURE.md, TODO.md, etc.)
- `/backups/` — backups Supabase (voir section 10)
- `/passwords/` — identifiants, secrets, credentials (jamais en clair dans le code ni commit)
- `/resources/` — ressources statiques de travail (logo, images sources, assets graphiques bruts avant intégration)
- `/ai/` — tout ce qui est lié à l'IA (prompts, sorties d'agents IA, fichiers de contexte pour Claude Code, etc.), séparé du reste pour ne pas polluer le repo

Le `.gitignore` doit explicitement lister ces cinq dossiers dès le premier commit du projet.

**Ce fichier lui-même** (`BRIEF-COMPLET-SAAS-ANIMAUX.md`) doit être placé dans `/docs/` dès le premier commit, et **tenu à jour par Claude Code à chaque ajout ou modification de fonctionnalité** — toute décision, précision ou changement de scope discuté en cours de développement doit être répercuté dans ce fichier, pas seulement dans DECISIONS.md/PROGRESS.md, pour qu'il reste la référence complète et à jour du produit.

## 8. Scope MVP (à valider par un test terrain avant d'aller plus loin)

1. Auth (email/mot de passe).
2. CRUD fiches animaux (texte + upload photos).
3. Page d'index du compte (`/[compte]`), listant les liens vers les galeries d'espèces disponibles — non bloquante, informative seulement.
3bis. Page galerie par espèce (`/[compte]/[espece]`), point d'entrée principal, listant les animaux publiés de cette espèce en grille, cliquables vers leur fiche détaillée.
3ter. Fiche animal (`/[compte]/[espece]/[slug]`), design par défaut correct même sans personnalisation, avec bouton de contact toujours visible (fallback sur le contact générique du compte si aucun contact spécifique n'est renseigné).
4. Compteur de vues basique sur la page publique.
5. Onglet personnalisation : police, 2 couleurs, choix parmi 4 dispositions de galerie (grille, empilée, alternée, carrousel), upload logo, lien de retour vers le site du refuge.
6. Génération de lien de partage direct + QR code pour chaque galerie d'espèce.
7. Dashboard listant les fiches avec vues totales.
8. Toutes les pages publiques (galerie + fiche, les 4 dispositions) testées et validées responsive sur mobile, tablette et desktop — critère de sortie du MVP, pas une amélioration ultérieure.
9. Galerie vide avec message propre si aucun animal publié pour une espèce.
10. Contact générique du compte affiché sur les pages publiques, en plus du contact par fiche.
11. Mention RGPD sur le formulaire de contact.
12. Aperçu avant publication ("voir comme un visiteur") depuis l'espace membre.
13. Export CSV des animaux depuis le dashboard.
14. Notification email automatique pour fiche non mise à jour depuis X jours.

**Hors scope MVP** : rôles multiples/multi-collaborateurs, paiement en ligne intégré (Stripe abonnement peut arriver en V1.1 une fois le concept validé), messagerie interne, export PDF, statistiques avancées (source de trafic détaillée), landing page commerciale Zoodomo (projet séparé).

## 9. Sécurité

Point non négociable — les comptes contiennent des données personnelles (coordonnées de contact des vendeurs/refuges) et les photos/fiches ont une valeur commerciale, donc tout doit être verrouillé dès le MVP, pas ajouté après coup :

- **RLS Supabase strict** sur toutes les tables privées (`accounts`, `account_theme`, `animaux`, `animal_photos`, `animal_views`) : un compte ne peut lire/écrire que ses propres données, jamais celles d'un autre compte.
- **Policies publiques minimales** : les pages publiques ne doivent exposer en lecture que les animaux au statut "publié" (pas les brouillons), et uniquement les colonnes nécessaires à l'affichage — pas d'accès direct aux emails ou infos sensibles des comptes.
- **Auth robuste** : mots de passe gérés par Supabase Auth (jamais stockés en clair), option de reset sécurisé, limite de tentatives de connexion (rate limiting).
- **Upload de photos sécurisé** : validation du type/taille des fichiers côté serveur, bucket Storage avec policies d'accès strictes (écriture réservée au propriétaire du compte, lecture publique uniquement sur les fichiers liés à des animaux publiés).
- **Secrets et clés** : `service role key`, clés API, credentials jamais exposés côté client, toujours en variables d'environnement côté serveur.
- **Protection contre le vol de contenu** : envisager un léger watermark ou une limitation de résolution sur les photos publiques si la valeur commerciale des visuels est un enjeu pour les vendeurs pro.
- **Sauvegardes régulières** de la base et du storage pour éviter toute perte de données (voir section 10).

## 10. Système de backup

À mettre en place dès que le projet a des données réelles, sur le modèle déjà utilisé sur mespoilus.com (voir prompt dédié ci-dessous, à donner à Claude Code) : dump SQL complet, données JSON par table, mirror Storage incrémental (jamais de re-téléchargement complet), utilisateurs Auth, advisors Supabase, Edge Functions, zip hebdomadaire automatique via tâche planifiée.

### Prompt à donner à Claude Code

Mets en place un système de backup Supabase complet et automatique pour ce projet, sur le modèle suivant :

**Ce qu'il doit contenir, à chaque backup :**
1. **Dump SQL complet** (`pg_dump`, schéma + données de toute la base)
2. **Métadonnées des tables** : colonnes, nombre de lignes, taille sur disque (via `information_schema` + `pg_stat_user_tables`)
3. **Données de chaque table en JSON lisible** (`SELECT * FROM public.<table>` par table), SAUF les tables volumineuses déjà entièrement couvertes par le dump SQL et non "métier" à relire à la main (catalogues de scraping externe, historiques de prix, logs volumineux) — à exclure explicitement pour ne pas dupliquer inutilement des dizaines de Mo chaque semaine
4. **Tous les fichiers Supabase Storage** (tous les buckets, toute l'arborescence)
5. **Utilisateurs Supabase Auth** (liste complète)
6. **Advisors Supabase** (lints sécurité + performance, via Management API) — utile pour avoir un historique de ce qui a été signalé/corrigé dans le temps
7. **Edge Functions déployées** (liste, même vide)

**Contrainte de taille — le point le plus important :**
Les fichiers Storage (images, PDF, vidéos) changent très rarement. Ne JAMAIS les re-télécharger et re-zipper
en entier à chaque backup — ça fait exploser la taille pour rien (ex: passé de 337 Mo à 15,5 Mo/semaine
rien qu'en réglant ça). À la place :
- Garder un dossier **mirror persistant** (`backups/storage_mirror/<bucket>/...`), jamais zippé, jamais supprimé,
  qui reflète l'état actuel de chaque fichier.
- À chaque run, comparer taille locale vs taille distante (`metadata.size` retourné par `storage.list()`) :
  si identique → ne rien faire (fichier déjà en cache) ; sinon → télécharger.
- Le zip hebdomadaire ne contient qu'un **manifeste** (bucket, chemin, taille, statut cached/downloaded),
  pas les fichiers eux-mêmes.
- Limite à connaître : si un fichier est réécrit sous le MÊME nom (contenu différent, taille différente),
  l'ancienne version locale est écrasée et perdue (pas de version historisée). Si ça doit être évité,
  ajouter un système de versioning (renommer l'ancien fichier avant remplacement) — sinon accepter la limite
  (les fichiers orphelins restaurés ne posent pas de problème, ils sont juste inertes).

**Rétention :**
Garder tous les backups datés indéfiniment (pas de suppression automatique) — le poids hebdo est faible
une fois l'optimisation storage faite (quelques dizaines de Mo maximum), donc pas besoin de purger.
Le mirror storage n'est de toute façon jamais purgé par date (seulement mis à jour par remplacement).

**Structure du zip généré (`backups/backup_<date>.zip`) :**
```
database/
  full_dump.sql          <- pg_dump complet
  tables_info.json       <- métadonnées (colonnes, row count, taille)
  tables/<table>.json    <- données lisibles, table par table (sauf exclusions)
storage/
  _manifest.json         <- liste des fichiers Storage (pas les fichiers)
auth/
  users.json
advisors/
  security.json
  performance.json
edge_functions/
  functions.json
```

**Implémentation (Windows + Task Scheduler) :**
- Un script PowerShell (`backup-supabase.ps1`, gitignoré, contient les creds DB) qui :
  1. Fait le `pg_dump` vers `<workdir>/database/full_dump.sql`
  2. Appelle un script Node (`scripts/full-backup.mjs <workdir> <storage_mirror_dir>`) qui gère storage/auth/advisors/tables JSON
     via les credentials Supabase déjà présents dans `.env.local` (URL + service role key + PAT `SUPABASE_ACCESS_TOKEN` pour la Management API)
  3. Zippe `<workdir>` en `backups/backup_<date>.zip` avec `Compress-Archive`, puis supprime le `<workdir>`
  4. Logge chaque étape dans `backups/backup.log` (avec succès/échec explicite — indispensable car le script
     tourne sans surveillance via Task Scheduler)
- Tâche planifiée Windows hebdomadaire (ex: lundi 3h), avec rattrapage si le PC est éteint à l'heure prévue.

**Pièges à éviter (rencontrés en le construisant) :**
- `Get-ChildItem $DIR -Include "*.ext"` sans `-Recurse` NI chemin en wildcard (`$DIR\*`) ignore silencieusement
  le filtre `-Include` — ne jamais utiliser cette forme sans vérifier que ça filtre vraiment quelque chose.
- Une extension Postgres créée avec `CREATE EXTENSION IF NOT EXISTS x;` va par défaut dans le schéma `public`
  → advisor WARN "extension_in_public". La créer dans un schéma dédié (`CREATE SCHEMA IF NOT EXISTS extensions;`
  puis `ALTER EXTENSION x SET SCHEMA extensions;`) ne casse pas les index qui en dépendent déjà.
- Toujours tester avec une vraie exécution (pas juste en théorie) avant de brancher sur la tâche planifiée :
  vérifier taille du zip, contenu, et qu'un 2e run n'agit bien que sur les fichiers Storage modifiés (0 téléchargement si rien n'a changé).

**Sécurité :**
- `backup-supabase.ps1`, `/backups/`, `/scripts/` doivent être dans `.gitignore` (creds DB en clair + données personnelles).
- Ne jamais committer le PAT Supabase (`SUPABASE_ACCESS_TOKEN`) ni la service role key.

## 11. Plan de validation avant de tout coder

Avant de construire la personnalisation avancée et la facturation, proposer une version gratuite/minimale à 3-5 refuges ou vendeurs pro réels pour valider :
- Est-ce qu'ils l'utilisent vraiment (créent des fiches, les partagent) ?
- Est-ce que la personnalisation visuelle est un vrai argument ou un nice-to-have ?
- Quel prix mensuel ils seraient prêts à payer.
