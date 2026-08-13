import type { Account, AccountTheme, AccountPhoto } from "@/types";

export const mockAccounts: Account[] = [
  {
    id: "account-refuge-quatre-pattes",
    email: "contact@refugequatrepattes.test",
    nom_affichage: "Refuge des Quatre Pattes",
    slug: "refuge-quatre-pattes",
    contact_email_public: "adoption@refugequatrepattes.test",
    contact_telephone_public: "02 527 10 50",
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
