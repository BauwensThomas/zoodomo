import type { Account, AccountTheme, AccountPhoto } from "@/types";

export const mockAccounts: Account[] = [
  {
    id: "account-refuge-quatre-pattes",
    email: "contact@refugequatrepattes.test",
    nom_affichage: "Refuge des Quatre Pattes",
    slug: "refuge-quatre-pattes",
    contact_email_public: "adoption@refugequatrepattes.test",
    contact_telephone_public: "02 527 10 50",
    adresse: "Rue des Refuges 12, 1000 Bruxelles",
    adresse_visible: true,
    numero_entreprise: "BE 0123.456.789",
    numero_entreprise_visible: true,
    a_propos: {
      fr: "Depuis 2005, le Refuge des Quatre Pattes recueille, soigne et fait adopter des animaux abandonnés ou maltraités de toute la région.\n\nNotre refuge est né de la volonté d'une poignée de bénévoles passionnés, et aujourd'hui toute notre équipe reste entièrement bénévole : plus de 30 personnes se relaient chaque semaine pour nourrir, promener et chouchouter nos pensionnaires.\n\nNous sommes ouverts au public du mardi au samedi, de 10h à 17h (fermé les jours fériés), et nous organisons régulièrement des journées portes ouvertes pour faire connaître nos animaux à adopter.\n\nChaque adoption fait l'objet d'un suivi personnalisé et d'une visite préalable, pour garantir le bien-être de l'animal comme de sa nouvelle famille.",
      nl: "Sinds 2005 vangt Refuge des Quatre Pattes verlaten of mishandelde dieren uit de hele regio op, verzorgt ze en helpt ze aan een nieuw thuis.\n\nOns opvangcentrum is ontstaan uit de inzet van een handvol gepassioneerde vrijwilligers, en ook vandaag werkt ons hele team volledig vrijwillig: meer dan 30 mensen wisselen elkaar wekelijks af om onze bewoners te voeden, uit te laten en te verzorgen.\n\nWe zijn open voor het publiek van dinsdag tot zaterdag, van 10u tot 17u (gesloten op feestdagen), en we organiseren regelmatig opendeurdagen om onze adopteerbare dieren voor te stellen.\n\nElke adoptie wordt persoonlijk opgevolgd en gaat vooraf aan een bezoek, om het welzijn van zowel het dier als zijn nieuwe gezin te garanderen.",
      en: "Since 2005, Refuge des Quatre Pattes has been taking in, caring for, and rehoming abandoned or mistreated animals from across the region.\n\nOur shelter began with a handful of passionate volunteers, and today our whole team remains entirely volunteer-run: more than 30 people take turns each week to feed, walk, and care for our residents.\n\nWe're open to the public Tuesday to Saturday, 10am to 5pm (closed on public holidays), and we regularly organize open days to introduce our adoptable animals.\n\nEvery adoption includes a personalized follow-up and a prior visit, to ensure the well-being of both the animal and its new family.",
    },
    langues_actives: ["fr", "nl", "en"],
    created_at: "2025-02-10T09:00:00.000Z",
  },
  {
    id: "account-elevage-bois-fleuri",
    email: "contact@elevageboisfleuri.test",
    nom_affichage: "Élevage du Bois Fleuri",
    slug: "elevage-bois-fleuri",
    contact_email_public: "info@elevageboisfleuri.test",
    contact_telephone_public: "04 366 22 18",
    adresse: null,
    adresse_visible: true,
    numero_entreprise: null,
    numero_entreprise_visible: true,
    a_propos: {},
    langues_actives: ["fr"],
    created_at: "2025-05-03T09:00:00.000Z",
  },
];

export const mockAccountThemes: AccountTheme[] = [
  {
    account_id: "account-refuge-quatre-pattes",
    police: "default",
    couleur_primaire: "#2f6b4f",
    couleur_secondaire: "#f4f1ea",
    disposition_photos: "grille",
    disposition_especes: "liste",
    disposition_presentation: "photo_texte",
    logo_url: "/mock/accounts/refuge-quatre-pattes-logo.png",
    lien_retour_site: "https://refugequatrepattes.test",
    updated_at: "2025-02-10T09:00:00.000Z",
  },
  {
    account_id: "account-elevage-bois-fleuri",
    police: "moderne",
    couleur_primaire: "#b5651d",
    couleur_secondaire: "#fbf7f2",
    disposition_photos: "alternee",
    disposition_especes: "vitrine",
    disposition_presentation: "texte_photos",
    logo_url: "/mock/accounts/elevage-bois-fleuri-logo.png",
    lien_retour_site: "https://elevageboisfleuri.test",
    updated_at: "2025-05-03T09:00:00.000Z",
  },
];

export const mockAccountPhotos: AccountPhoto[] = [
  {
    id: "ap-refuge-1",
    account_id: "account-refuge-quatre-pattes",
    url: "/mock/accounts/refuge-quatre-pattes-1.jpg",
    ordre: 1,
    created_at: "2025-02-10T09:00:00.000Z",
  },
  {
    id: "ap-refuge-2",
    account_id: "account-refuge-quatre-pattes",
    url: "/mock/accounts/refuge-quatre-pattes-2.jpg",
    ordre: 2,
    created_at: "2025-02-10T09:00:00.000Z",
  },
  {
    id: "ap-elevage-1",
    account_id: "account-elevage-bois-fleuri",
    url: "/mock/accounts/elevage-bois-fleuri-1.jpg",
    ordre: 1,
    created_at: "2025-05-03T09:00:00.000Z",
  },
];
