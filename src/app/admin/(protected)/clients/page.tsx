import Link from "next/link";
import { Search, Users, X } from "lucide-react";
import { listAccounts, listAnimauxByAccountAll } from "@/lib/mock";
import { trialDaysRemaining, isTrialExpired } from "@/lib/mock/helpers";
import { createClient } from "@/lib/supabase/server";
import type { Account } from "@/types";

const PLAN_LABEL: Record<Account["plan"], string> = {
  essai: "Essai",
  mensuel: "Mensuel",
  annuel: "Annuel",
};

function planDisplay(account: Account): { label: string; className: string } {
  if (account.plan === "essai") {
    if (isTrialExpired(account)) {
      return { label: "Essai expiré", className: "bg-rose-100 text-rose-700" };
    }
    const remaining = trialDaysRemaining(account) ?? 0;
    return {
      label: `Essai (${remaining}j restant${remaining > 1 ? "s" : ""})`,
      className: "bg-amber-100 text-amber-700",
    };
  }
  return { label: PLAN_LABEL[account.plan], className: "bg-emerald-100 text-emerald-700" };
}

// Page admin volontairement en français uniquement (équipe Zoodomo interne), pas de
// next-intl ici contrairement au reste de l'app. Extrait de l'ancien `page.tsx` (onglet
// Messages) lors de la restructuration en onglets, voir docs/DECISIONS.md.
export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const isSearching = Boolean(q && q.trim());

  const admin = await createClient();
  const allAccounts = await listAccounts(admin);
  const accounts = isSearching
    ? allAccounts.filter((a) => a.email.toLowerCase().includes(q!.trim().toLowerCase()))
    : allAccounts;
  const animalCountByAccountId = new Map(
    await Promise.all(
      accounts.map(async (a) => [a.id, (await listAnimauxByAccountAll(admin, a.id)).length] as const)
    )
  );

  return (
    <section>
      <h1 className="flex items-center gap-2 font-heading text-xl font-medium text-foreground">
        <Users className="h-5 w-5" />
        Comptes clients ({accounts.length})
      </h1>

      <form action="/admin/clients" method="get" className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-55 max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Rechercher un client par email..."
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
            href="/admin/clients"
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
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-foreground bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-foreground">
              <tr className="divide-x divide-border">
                <th className="whitespace-nowrap px-3 py-2 font-medium">Nom</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Email</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Langue</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Abonnement</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Animaux</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr
                  key={account.id}
                  className="divide-x divide-border border-b border-border text-foreground last:border-b-0"
                >
                  <td className="whitespace-nowrap px-3 py-2 font-medium">{account.nom_affichage}</td>
                  <td className="whitespace-nowrap px-3 py-2">{account.email}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span
                      title={
                        account.langue_interface
                          ? undefined
                          : "Ce compte ne s'est encore jamais connecté : sa langue sera fixée automatiquement (choix fait à ce moment-là) dès sa première connexion."
                      }
                      className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
                    >
                      {account.langue_interface ? account.langue_interface.toUpperCase() : "Automatique"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {(() => {
                      const plan = planDisplay(account);
                      return (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${plan.className}`}
                        >
                          {plan.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{animalCountByAccountId.get(account.id) ?? 0}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {new Date(account.created_at).toLocaleDateString("fr")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
