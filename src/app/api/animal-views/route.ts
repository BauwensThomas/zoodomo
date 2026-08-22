import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAnimalView } from "@/lib/mock/store";

/**
 * Enregistre une vue de fiche animal, appelé côté client (voir `RecordAnimalView.tsx`) plutôt
 * que directement dans le rendu de la page publique : un composant serveur exécuté pendant
 * son rendu est un effet de bord impur, que React double-invoque volontairement en
 * développement (Strict Mode) pour le détecter, ce qui comptait 2 vues pour une seule vraie
 * visite (constaté et corrigé, voir docs/DECISIONS.md). Même risque en production dès qu'un
 * lien vers la fiche serait préchargé par Next.js. Client `service_role` : visiteur anonyme,
 * pas de session Supabase Auth ici.
 */
export async function POST(request: NextRequest) {
  const { animalId } = await request.json().catch(() => ({ animalId: null }));
  if (typeof animalId !== "string" || !animalId) {
    return NextResponse.json({ error: "animalId requis" }, { status: 400 });
  }

  const supabase = createAdminClient();
  await recordAnimalView(supabase, animalId);

  return NextResponse.json({ ok: true });
}
