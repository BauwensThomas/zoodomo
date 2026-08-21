import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { getSessionAccount } from "@/lib/mock/auth";
import {
  countUnreadAccountMessages,
  hasAccountMessage,
  sendAccountMessage,
} from "@/lib/mock/store";
import { getStaleFichesDisponibles, STALE_FICHE_DAYS } from "@/lib/mock/helpers";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import { EspaceNav } from "./EspaceNav";
import { logoutAction } from "./actions";
import type { Locale } from "@/types";

/**
 * Messages automatiques (bienvenue au premier accès, rappel de fiche non mise à jour) :
 * pas de tâche planifiée en phase mockée, donc vérifiés/générés à chaque chargement de
 * l'espace membre (comme `recordAnimalView` pour les vues), avec un garde-fou
 * (`hasAccountMessage`) pour ne jamais envoyer le même message deux fois.
 */
async function ensureAutomaticMessages(accountId: string) {
  const t = await getTranslations("admin.messages");
  // Généré dans la langue résolue au moment de la création (compte connecté = priorité à
  // `Account.langue_interface`, voir `src/i18n/request.ts`) : chaque `AccountMessage`
  // appartient déjà à un seul compte, pas besoin de le générer dans plusieurs langues à la
  // fois comme avant, voir docs/DECISIONS.md.

  if (!hasAccountMessage(accountId, "bienvenue")) {
    sendAccountMessage({
      account_id: accountId,
      kind: "bienvenue",
      subject: t("welcomeSubject"),
      body: t("welcomeBody"),
    });
  }

  for (const animal of getStaleFichesDisponibles(accountId)) {
    if (!hasAccountMessage(accountId, "rappel_fiche", animal.id)) {
      sendAccountMessage({
        account_id: accountId,
        kind: "rappel_fiche",
        subject: t("staleSubject", { name: animal.nom }),
        body: t("staleBody", { name: animal.nom, days: STALE_FICHE_DAYS }),
        animal_id: animal.id,
      });
    }
  }
}

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  await ensureAutomaticMessages(account.id);
  const unreadMessages = countUnreadAccountMessages(account.id);

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("admin");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-white">
        <div className="mx-auto grid max-w-[100rem] grid-cols-3 items-center px-6 py-3">
          <Link href="/espace" className="justify-self-start">
            <ZoodomoLogo width={120} />
          </Link>
          <span className="justify-self-center text-sm font-medium text-foreground">
            {account.nom_affichage}
          </span>
          <div className="flex items-center gap-3 justify-self-end">
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-opacity hover:opacity-80"
              >
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </button>
            </form>
            <LocaleSwitcher current={locale} />
          </div>
        </div>
        <EspaceNav unreadMessages={unreadMessages} />
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-[100rem] px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
