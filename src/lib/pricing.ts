/**
 * Prix de l'abonnement Zoodomo, en variables d'environnement plutôt qu'en dur dans le code
 * ou les traductions : permet de les changer sans toucher au code (`.env.local`, voir
 * `.env.local.example`), demande explicite de l'utilisateur. Valeurs par défaut = celles
 * décidées le 2026-08-22 (voir docs/DECISIONS.md), utilisées tant que les variables ne sont
 * pas définies (aucune configuration à changer pour continuer à fonctionner tel quel).
 * Préfixe `NEXT_PUBLIC_` volontaire (contrairement à `ZOODOMO_ADMIN_*`, jamais public) : ce
 * sont des prix affichés publiquement, aucune raison de les garder côté serveur uniquement,
 * et ce fichier est aussi importé depuis des composants `"use client"` (page de connexion et
 * d'inscription), qui ne peuvent lire que des variables d'environnement `NEXT_PUBLIC_*`.
 */
export const MONTHLY_PRICE_EUR = Number(process.env.NEXT_PUBLIC_ZOODOMO_PRICE_MONTHLY) || 19;
export const ANNUAL_PRICE_EUR = Number(process.env.NEXT_PUBLIC_ZOODOMO_PRICE_ANNUAL) || 190;
