import type { Account, AccountTheme, AccountPhoto } from "@/types";

/**
 * Plus de comptes de démo préremplis (retirés le 2026-08-22, voir docs/DECISIONS.md) : la
 * base réelle (Supabase) part vide, et le store mocké suit le même principe le temps de la
 * migration, pour tester avec un vrai compte créé via `/inscription` plutôt qu'avec des
 * données figées.
 */
export const mockAccounts: Account[] = [];

export const mockAccountThemes: AccountTheme[] = [];

export const mockAccountPhotos: AccountPhoto[] = [];
