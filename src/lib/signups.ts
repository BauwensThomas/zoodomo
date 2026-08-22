/** `false` seulement si `ZOODOMO_SIGNUPS_ENABLED` vaut explicitement `"false"` : absente ou
 * toute autre valeur laisse les inscriptions ouvertes, rien à configurer pour continuer à
 * fonctionner tel quel. Sert à fermer temporairement `/inscription` (ex. site mis en ligne
 * pour tester la réception d'emails réels sans vouloir de vraies inscriptions), voir
 * `docs/DECISIONS.md`. */
export function signupsEnabled(): boolean {
  return process.env.ZOODOMO_SIGNUPS_ENABLED !== "false";
}
