/**
 * Anti-bruteforce pour la connexion admin (`/admin/login`), volontairement distinct de la
 * migration Supabase Auth : cette connexion reste basée sur des identifiants en variable
 * d'environnement (voir `src/lib/mock/admin-auth.ts`), jamais branchée sur Supabase, donc le
 * rate limiting natif de Supabase Auth ne la couvrira jamais. Compteur en mémoire par IP,
 * remis à zéro au redémarrage du serveur de dev (même limite assumée que le reste du store
 * mocké) : à revoir pour une vraie persistance (ou un rate limiting au niveau infra/edge) une
 * fois en production, voir docs/DECISIONS.md.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

const attempts = new Map<string, AttemptRecord>();

/** `null` si non bloqué, sinon le timestamp (ms) jusqu'auquel l'IP reste bloquée. */
export function isBlocked(key: string): number | null {
  const record = attempts.get(key);
  if (!record?.blockedUntil) return null;
  if (record.blockedUntil <= Date.now()) {
    attempts.delete(key);
    return null;
  }
  return record.blockedUntil;
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: now, blockedUntil: null });
    return;
  }
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + LOCKOUT_MS;
  }
}

export function resetAttempts(key: string): void {
  attempts.delete(key);
}
