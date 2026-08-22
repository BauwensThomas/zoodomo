import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { getSessionAccount, isSessionEmailConfirmed } from "@/lib/mock/auth";
import { createClient } from "@/lib/supabase/server";
import {
  countUnreadAccountMessages,
  hasAccountMessage,
  logAutomaticMessageSent,
  sendAccountMessage,
} from "@/lib/mock/store";
import {
  getStaleFichesDisponibles,
  STALE_FICHE_DAYS,
  TRIAL_DAYS,
  GRACE_HOURS,
  isTrialExpired,
  trialDaysRemaining,
} from "@/lib/mock/helpers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ZoodomoLogo } from "@/components/ZoodomoLogo";
import { MONTHLY_PRICE_EUR, ANNUAL_PRICE_EUR } from "@/lib/pricing";
import { EspaceNav } from "./EspaceNav";
import { PlanPopup } from "./PlanPopup";
import { logoutAction } from "./actions";
import type { Account, Locale } from "@/types";

/**
 * Messages automatiques (bienvenue au premier accès, rappel de fiche non mise à jour,
 * échéances de l'essai gratuit) : pas de tâche planifiée en phase mockée, donc
 * vérifiés/générés à chaque chargement de l'espace membre (comme `recordAnimalView` pour
 * les vues), avec un garde-fou (`hasAccountMessage`) pour ne jamais envoyer le même message
 * deux fois.
 */
async function ensureAutomaticMessages(supabase: SupabaseClient, account: Account) {
  const accountId = account.id;
  const t = await getTranslations("admin.messages");
  // Généré dans la langue résolue au moment de la création (compte connecté = priorité à
  // `Account.langue_interface`, voir `src/i18n/request.ts`) : chaque `AccountMessage`
  // appartient déjà à un seul compte, pas besoin de le générer dans plusieurs langues à la
  // fois comme avant, voir docs/DECISIONS.md. `subject`/`body` stockés ici pour tous les
  // types automatiques sont regénérés à l'affichage dans la langue actuelle du compte
  // (`renderMessageText`, `src/app/espace/messages/page.tsx`), y compris pour les échéances
  // de l'essai (4j/1j restants) : ce ne sont pas des textes figés dans la langue du jour
  // d'envoi, contrairement à un message admin rédigé par un humain une fois pour toutes.
  //
  // `created_at` de chaque message daté du jour où il aurait réellement été envoyé
  // (`account.created_at` + le nombre de jours écoulés à ce moment-là), pas de la date du
  // jour : sans ça, un compte qui se connecte pour la première fois après plusieurs jours
  // d'absence verrait tous ses messages porter la même date, alors qu'ils couvrent une
  // quinzaine de jours.
  const addDays = (iso: string, days: number) =>
    new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();

  if (!(await hasAccountMessage(supabase, accountId, "bienvenue"))) {
    await sendAccountMessage(supabase, {
      account_id: accountId,
      kind: "bienvenue",
      subject: t("welcomeSubject"),
      body: t("welcomeBody"),
      created_at: account.created_at,
    });
    await logAutomaticMessageSent(supabase, accountId, "bienvenue");
  }

  if (!(await hasAccountMessage(supabase, accountId, "essai_gratuit"))) {
    await sendAccountMessage(supabase, {
      account_id: accountId,
      kind: "essai_gratuit",
      subject: t("trialSubject", { days: TRIAL_DAYS }),
      body: t("trialBody", { days: TRIAL_DAYS, hours: GRACE_HOURS }),
      // +1 minute sur "bienvenue" (même instant sinon) : garantit que ce message reste
      // toujours au-dessus dans la boîte de réception (triée par date décroissante), ordre
      // demandé explicitement plutôt que laissé au hasard de l'ordre d'insertion.
      created_at: addDays(account.created_at, 1 / 1440),
    });
    await logAutomaticMessageSent(supabase, accountId, "essai_gratuit");
  }

  const remaining = trialDaysRemaining(account);
  if (remaining !== null) {
    if (remaining <= 4 && !(await hasAccountMessage(supabase, accountId, "essai_rappel_4j"))) {
      await sendAccountMessage(supabase, {
        account_id: accountId,
        kind: "essai_rappel_4j",
        subject: t("trialReminder4Subject"),
        body: t("trialReminder4Body"),
        created_at: addDays(account.created_at, TRIAL_DAYS - 4),
      });
      await logAutomaticMessageSent(supabase, accountId, "essai_rappel_4j");
    }
    if (remaining <= 1 && !(await hasAccountMessage(supabase, accountId, "essai_rappel_1j"))) {
      await sendAccountMessage(supabase, {
        account_id: accountId,
        kind: "essai_rappel_1j",
        subject: t("trialReminder1Subject"),
        body: t("trialReminder1Body", { hours: GRACE_HOURS }),
        created_at: addDays(account.created_at, TRIAL_DAYS - 1),
      });
      await logAutomaticMessageSent(supabase, accountId, "essai_rappel_1j");
    }
  }

  for (const animal of await getStaleFichesDisponibles(supabase, accountId)) {
    if (!(await hasAccountMessage(supabase, accountId, "rappel_fiche", animal.id))) {
      await sendAccountMessage(supabase, {
        account_id: accountId,
        kind: "rappel_fiche",
        subject: t("staleSubject", { name: animal.nom }),
        body: t("staleBody", { name: animal.nom, days: STALE_FICHE_DAYS }),
        animal_id: animal.id,
      });
      await logAutomaticMessageSent(supabase, accountId, "rappel_fiche", animal.id);
    }
  }
}

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const account = await getSessionAccount();
  if (!account) redirect("/");
  // Compte non vérifié : tableau de bord inaccessible tant que le lien de confirmation
  // envoyé par Supabase Auth n'a pas été cliqué (statut natif `email_confirmed_at`, plus de
  // champ maison depuis le 2026-08-22), voir docs/DECISIONS.md.
  if (!(await isSessionEmailConfirmed()))
    redirect(`/verification-email?email=${encodeURIComponent(account.email)}`);

  const supabase = await createClient();
  await ensureAutomaticMessages(supabase, account);
  const unreadMessages = await countUnreadAccountMessages(supabase, account.id);
  const showPlanPopup = isTrialExpired(account);

  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("admin");
  const tTrial = await getTranslations("admin.trialPopup");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-white">
        {/* `flex flex-wrap` plutôt que `grid grid-cols-3` : sur un petit écran (375px), 3
            colonnes égales de largeur fixe n'ont pas la place d'accueillir le nom du compte
            (variable, parfois long) sans déborder par-dessus le bouton Déconnexion (bug
            remonté par l'utilisateur). Avec `flex-wrap`, le nom du compte (`order-3 w-full`
            en mobile uniquement) passe automatiquement à la ligne sous le logo/les actions
            au lieu de les chevaucher, et repasse sur la même ligne dès que la largeur
            disponible le permet (`sm:order-0 sm:w-auto`, réordonné à l'identique du
            layout desktop d'origine). Bouton Déconnexion réduit à son icône seule en
            dessous de `sm:` pour laisser plus de place, voir docs/DECISIONS.md. */}
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-4 py-3 sm:flex-nowrap sm:px-6">
          <Link href="/espace" className="shrink-0">
            <ZoodomoLogo width={110} />
          </Link>
          <span className="order-3 w-full min-w-0 truncate text-center text-sm font-medium text-foreground sm:order-0 sm:w-auto sm:flex-1">
            {account.nom_affichage}
          </span>
          <div className="order-2 flex shrink-0 items-center gap-2 sm:order-0 sm:gap-3">
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label={t("logout")}
                title={t("logout")}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1.5 text-sm font-medium text-foreground shadow-sm transition-opacity hover:opacity-80 sm:px-3"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("logout")}</span>
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
      {showPlanPopup && (
        <PlanPopup
          title={tTrial("title")}
          body={tTrial("body")}
          monthlyLabel={tTrial("monthlyLabel")}
          monthlyPrice={tTrial("monthlyPrice", { price: MONTHLY_PRICE_EUR })}
          annualLabel={tTrial("annualLabel")}
          annualPrice={tTrial("annualPrice", { price: ANNUAL_PRICE_EUR })}
          annualHint={tTrial("annualHint")}
          autoRenewNotice={tTrial("autoRenewNotice")}
          choose={tTrial("choose")}
        />
      )}
    </div>
  );
}
