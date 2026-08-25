import Link from "next/link";
import { Images, Search, X } from "lucide-react";
import { listAccounts, listAllStorageObjectsForAccount } from "@/lib/mock";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AccountPhotosAccordion } from "./AccountPhotosAccordion";

// Page admin volontairement en français uniquement (équipe Zoodomo interne), pas de
// next-intl ici contrairement au reste de l'app. Consultation seule (aucune action possible
// ici), taille par fichier lue directement depuis Storage (`metadata.size`, aucune colonne
// dédiée en base), décision utilisateur du 2026-08-24. Chaque compte replié par défaut
// (`AccountPhotosAccordion`, seul le nom/email/nombre est visible tant que non déroulé) :
// les métadonnées (chemins/tailles) restent lues côté serveur pour tous les comptes (léger,
// aucun octet d'image transféré), mais les `<img>` elles-mêmes ne se chargent qu'une fois un
// compte déroulé, demande utilisateur du 2026-08-25.
export default async function AdminPhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const isSearching = Boolean(q && q.trim());

  const session = await createClient();
  const allAccounts = await listAccounts(session);
  // Filtre par email avant d'aller chercher les fichiers Storage (un appel par compte) :
  // pas la peine de lister le Storage d'un compte déjà exclu par la recherche.
  const accounts = isSearching
    ? allAccounts.filter((a) => a.email.toLowerCase().includes(q!.trim().toLowerCase()))
    : allAccounts;

  // `service_role` requis ici (pas le client de session utilisé pour `listAccounts`
  // ci-dessus) : `storage.objects` a une policy RLS qui ne laisse un compte lister que son
  // propre dossier (`auth.uid() = premier segment du chemin`, `0009_photos_storage_bucket.sql`),
  // donc le client de session de l'admin (une identité différente de chaque compte pro) ne
  // verrait jamais aucun fichier avec le client normal, quel que soit le compte demandé. Bug
  // réel constaté (`.list()` renvoyait silencieusement un tableau vide pour tous les
  // comptes) avant ce correctif.
  const admin = createAdminClient();
  const photosByAccount = await Promise.all(
    accounts.map(async (account) => {
      const files = await listAllStorageObjectsForAccount(admin, account.id);
      const withUrls = files.map((f) => ({
        ...f,
        url: admin.storage.from("photos").getPublicUrl(f.path).data.publicUrl,
      }));
      return { account, files: withUrls };
    })
  );

  const accountsWithPhotos = photosByAccount.filter((p) => p.files.length > 0);
  const totalFiles = accountsWithPhotos.reduce((sum, p) => sum + p.files.length, 0);

  return (
    <section>
      <h1 className="flex items-center gap-2 font-heading text-xl font-medium text-foreground">
        <Images className="h-5 w-5" />
        Photos ({totalFiles})
      </h1>

      <form action="/admin/photos" method="get" className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-55 max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Rechercher un compte par email..."
            className="w-full rounded-full border border-foreground bg-card py-2 pl-9 pr-3.5 text-sm text-foreground outline-none focus:border-foreground"
          />
        </div>
        <button
          type="submit"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          <Search className="h-4 w-4" />
          Rechercher
        </button>
        {isSearching && (
          <Link
            href="/admin/photos"
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-foreground px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
            Effacer
          </Link>
        )}
      </form>

      {isSearching && accounts.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-sm text-foreground">
          Aucun client avec un email correspondant à &quot;{q}&quot;.
        </p>
      ) : accountsWithPhotos.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-sm text-foreground">
          Aucune photo pour le moment.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {accountsWithPhotos.map(({ account, files }) => (
            <AccountPhotosAccordion
              key={account.id}
              nom={account.nom_affichage}
              email={account.email}
              files={files}
            />
          ))}
        </div>
      )}
    </section>
  );
}
