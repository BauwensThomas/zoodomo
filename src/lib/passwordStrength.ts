/**
 * Règles de robustesse du mot de passe à l'inscription : au moins 8 caractères, un chiffre,
 * un caractère spécial. Utilisé à la fois côté client (`InscriptionForm.tsx`, affiché en
 * direct pendant la saisie) et côté serveur (`src/app/signup-actions.ts`, défense en
 * profondeur), pour ne pas dupliquer les règles à deux endroits.
 */
export const PASSWORD_MIN_LENGTH = 8;

export function hasMinLength(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}

export function hasDigit(password: string): boolean {
  return /[0-9]/.test(password);
}

export function hasSpecialChar(password: string): boolean {
  return /[^A-Za-z0-9]/.test(password);
}

export function isPasswordStrongEnough(password: string): boolean {
  return hasMinLength(password) && hasDigit(password) && hasSpecialChar(password);
}
