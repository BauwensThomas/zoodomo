// Empêche la pause automatique du projet Supabase (plan gratuit, mise en pause après 7 jours
// sans requête sur la base). Une vraie requête SQL (pas juste un appel HTTP à l'API REST) :
// Supabase ne compte comme activité que les requêtes qui touchent réellement Postgres, voir
// docs/DECISIONS.md/TODO.md. Lancé par .github/workflows/keep-supabase-alive.yml.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("SUPABASE_URL/SUPABASE_ANON_KEY manquants (secrets GitHub Actions).");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const { count, error } = await supabase
  .from("especes")
  .select("*", { count: "exact", head: true });

if (error) {
  console.error("Ping Supabase échoué :", error.message);
  process.exit(1);
}

console.log(`Ping Supabase OK, ${count} lignes dans "especes".`);
