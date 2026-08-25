import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Sparkles,
  Clock,
  Megaphone,
  Gift,
  Hourglass,
  Star,
  Trash2,
  Archive,
  ArchiveRestore,
  RotateCcw,
  Mail,
  MailOpen,
  MessageCircleQuestion,
  Send,
  type LucideIcon,
} from "lucide-react";
import { getSessionAccount } from "@/lib/mock/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TabLink } from "@/components/TabLink";
import {
  listAccountMessages,
  listArchivedAccountMessages,
  listTrashedAccountMessages,
  listSupportMessagesSentByAccount,
  getAnimalById,
  resolveRatingRequestContent,
  STALE_FICHE_DAYS,
  TRIAL_DAYS,
  GRACE_HOURS,
} from "@/lib/mock";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  archiveMessageAction,
  unarchiveMessageAction,
  trashMessageAction,
  restoreMessageAction,
  deleteMessageAction,
  setMessageReadAction,
} from "../actions";
import type { AccountMessage, AccountMessageKind, Locale, SupportReason } from "@/types";

const KIND_ICON: Record<AccountMessageKind, LucideIcon> = {
  bienvenue: Sparkles,
  rappel_fiche: Clock,
  essai_gratuit: Gift,
  essai_rappel_4j: Hourglass,
  essai_rappel_1j: Hourglass,
  admin: Megaphone,
  avis_demande: Star,
};

const REASON_LABEL_KEY: Record<SupportReason, string> = {
  bug: "contactReasonBug",
  compte: "contactReasonCompte",
  suggestion: "contactReasonSuggestion",
  autre: "contactReasonAutre",
};

/**
 * Les messages automatiques (bienvenue, rappel de fiche) ne sont pas "figés" dans la langue
 * active au moment de leur création : contrairement à un message admin (rédigé une fois par
 * un humain, dans une langue précise, qui ne doit jamais changer), ils sont regénérés à
 * l'affichage dans la langue d'interface actuelle du compte, comme n'importe quel autre
 * texte de l'app. `subject`/`body` stockés à la création restent une simple valeur de repli
 * si jamais l'animal concerné a été supprimé depuis, voir docs/DECISIONS.md.
 */
async function renderMessageText(
  supabase: SupabaseClient,
  serviceRole: SupabaseClient,
  message: AccountMessage,
  t: Awaited<ReturnType<typeof getTranslations<"admin.messages">>>,
  locale: Locale,
  baseUrl: string
): Promise<{ subject: string; body: string; linkUrl: string | null; linkLabel: string | null }> {
  if (message.kind === "bienvenue") {
    return { subject: t("welcomeSubject"), body: t("welcomeBody"), linkUrl: null, linkLabel: null };
  }
  if (message.kind === "rappel_fiche") {
    const animal = message.animal_id ? await getAnimalById(supabase, message.animal_id) : undefined;
    if (!animal) return { subject: message.subject, body: message.body, linkUrl: null, linkLabel: null };
    return {
      subject: t("staleSubject", { name: animal.nom }),
      body: t("staleBody", { name: animal.nom, days: STALE_FICHE_DAYS }),
      linkUrl: null,
      linkLabel: null,
    };
  }
  if (message.kind === "essai_gratuit") {
    return {
      subject: t("trialSubject", { days: TRIAL_DAYS }),
      body: t("trialBody", { days: TRIAL_DAYS, hours: GRACE_HOURS }),
      linkUrl: null,
      linkLabel: null,
    };
  }
  if (message.kind === "essai_rappel_4j") {
    return { subject: t("trialReminder4Subject"), body: t("trialReminder4Body"), linkUrl: null, linkLabel: null };
  }
  if (message.kind === "essai_rappel_1j") {
    return {
      subject: t("trialReminder1Subject"),
      body: t("trialReminder1Body", { hours: GRACE_HOURS }),
      linkUrl: null,
      linkLabel: null,
    };
  }
  if (message.kind === "avis_demande") {
    // `account_ratings` n'a aucun `GRANT` pour le rôle `authenticated` (voir
    // supabase/migrations/0019_account_ratings.sql), y compris pour le propriétaire de la
    // ligne : un client service_role dédié est nécessaire ici, `supabase` (client de session)
    // ne suffit pas. Même bug déjà rencontré côté admin (Photos/Votes), voir docs/DECISIONS.md.
    const content = await resolveRatingRequestContent(serviceRole, message.account_id, locale, baseUrl);
    // Depuis la boîte de réception du pro déjà connecté, le lien reste dans l'espace membre
    // (`/espace/avis`, garde la navigation Dashboard/Mes fiches/etc. visible) plutôt que vers
    // la page publique par token : demande utilisateur du 2026-08-25, "on doit rester dans le
    // dashboard". La page publique par token reste inchangée pour le lien envoyé par email.
    return {
      subject: content.subject,
      body: content.body,
      linkUrl: content.linkUrl ? "/espace/avis" : null,
      linkLabel: content.buttonLabel,
    };
  }
  return { subject: message.subject, body: message.body, linkUrl: null, linkLabel: null };
}

type View = "inbox" | "archives" | "corbeille" | "envoyes";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const account = await getSessionAccount();
  if (!account) redirect("/");

  const { view: viewParam } = await searchParams;
  const view: View =
    viewParam === "archives"
      ? "archives"
      : viewParam === "corbeille"
        ? "corbeille"
        : viewParam === "envoyes"
          ? "envoyes"
          : "inbox";

  const t = await getTranslations("admin.messages");
  const locale = (await getLocale()) as Locale;
  const dateLocale = locale === "en" ? "en-GB" : locale;

  const supabase = await createClient();
  const messages =
    view === "archives"
      ? await listArchivedAccountMessages(supabase, account.id)
      : view === "corbeille"
        ? await listTrashedAccountMessages(supabase, account.id)
        : view === "envoyes"
          ? []
          : await listAccountMessages(supabase, account.id);
  const sentMessages = view === "envoyes" ? await listSupportMessagesSentByAccount(supabase, account.id) : [];

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const serviceRole = createAdminClient();
  const renderedByMessageId = new Map(
    await Promise.all(
      messages.map(async (m) => [m.id, await renderMessageText(supabase, serviceRole, m, t, locale, baseUrl)] as const)
    )
  );

  const tabs: { key: View; href: string; label: string }[] = [
    { key: "inbox", href: "/espace/messages", label: t("inbox") },
    { key: "archives", href: "/espace/messages?view=archives", label: t("viewArchived") },
    { key: "corbeille", href: "/espace/messages?view=corbeille", label: t("viewTrash") },
    { key: "envoyes", href: "/espace/messages?view=envoyes", label: t("viewSent") },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-medium tracking-tight text-foreground">
          {t("title")}
        </h1>
        <Link
          href="/espace/messages/contact"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:opacity-70"
        >
          <MessageCircleQuestion className="h-4 w-4" />
          {t("contactTitle")}
        </Link>
      </div>

      <div className="sticky top-25.25 z-10 mt-3 flex gap-1 border-b border-border bg-background">
        {tabs.map((tab) => (
          <TabLink key={tab.key} href={tab.href} active={view === tab.key}>
            {tab.label}
          </TabLink>
        ))}
      </div>

      {view === "envoyes" ? (
        sentMessages.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground">
            {t("emptySent")}
          </p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {sentMessages.map((message) => (
              <div
                key={message.id}
                className="flex items-start gap-3 rounded-2xl border border-foreground bg-card p-4"
              >
                <Send className="mt-0.5 h-5 w-5 shrink-0 text-(--account-primary)" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="font-medium text-foreground">{message.subject}</p>
                    <p className="shrink-0 text-xs text-foreground">
                      {new Date(message.created_at).toLocaleString(dateLocale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <p className="text-xs text-foreground">{t(REASON_LABEL_KEY[message.reason])}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-foreground">{message.body}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : messages.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-foreground">
          {view === "archives" ? t("emptyArchived") : view === "corbeille" ? t("emptyTrash") : t("empty")}
        </p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {messages.map((message) => {
            const Icon = KIND_ICON[message.kind];
            const { subject, body, linkUrl, linkLabel } = renderedByMessageId.get(message.id)!;
            const unread = view === "inbox" && !message.read;
            const textClass = unread ? "text-orange-950" : "text-foreground";
            return (
              <div
                key={message.id}
                className={`flex items-start gap-3 rounded-2xl border p-4 ${
                  unread ? "border-orange-300 bg-orange-100" : "border-foreground bg-card"
                }`}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-(--account-primary)" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className={`font-medium ${textClass}`}>{subject}</p>
                    <p className={`shrink-0 text-xs ${textClass}`}>
                      {new Date(message.created_at).toLocaleString(dateLocale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <p className={`mt-1 whitespace-pre-line text-sm ${textClass}`}>{body}</p>
                  {linkLabel &&
                    (linkUrl ? (
                      <a
                        href={linkUrl}
                        className="rating-request-button mt-2 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
                      >
                        {linkLabel}
                      </a>
                    ) : (
                      <p className={`mt-2 text-xs font-medium ${textClass}`}>{linkLabel}</p>
                    ))}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {view === "corbeille" ? (
                    <>
                      <form action={restoreMessageAction.bind(null, message.id)}>
                        <button
                          type="submit"
                          aria-label={t("restore")}
                          title={t("restore")}
                          className="cursor-pointer rounded-full p-1.5 text-foreground transition-colors hover:bg-muted"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </form>
                      <form action={deleteMessageAction.bind(null, message.id)}>
                        <button
                          type="submit"
                          aria-label={t("deleteForever")}
                          title={t("deleteForever")}
                          className="cursor-pointer rounded-full p-1.5 text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      {/* Lu/non lu n'a de sens que dans la boîte de réception : un message
                          archivé est déjà "traité" (retour utilisateur), pas de bascule ici. */}
                      {view === "inbox" && (
                        <form action={setMessageReadAction.bind(null, message.id, !message.read)}>
                          <button
                            type="submit"
                            aria-label={message.read ? t("markUnread") : t("markRead")}
                            title={message.read ? t("markUnread") : t("markRead")}
                            className={`cursor-pointer rounded-full p-1.5 transition-colors hover:bg-muted ${textClass}`}
                          >
                            {message.read ? (
                              <Mail className="h-4 w-4" />
                            ) : (
                              <MailOpen className="h-4 w-4" />
                            )}
                          </button>
                        </form>
                      )}
                      {view === "archives" ? (
                        <form action={unarchiveMessageAction.bind(null, message.id)}>
                          <button
                            type="submit"
                            aria-label={t("unarchive")}
                            title={t("unarchive")}
                            className={`cursor-pointer rounded-full p-1.5 transition-colors hover:bg-muted ${textClass}`}
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </button>
                        </form>
                      ) : (
                        <form action={archiveMessageAction.bind(null, message.id)}>
                          <button
                            type="submit"
                            aria-label={t("archive")}
                            title={t("archive")}
                            className={`cursor-pointer rounded-full p-1.5 transition-colors hover:bg-muted ${textClass}`}
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        </form>
                      )}
                      <form action={trashMessageAction.bind(null, message.id)}>
                        <button
                          type="submit"
                          aria-label={t("delete")}
                          title={t("delete")}
                          className={`cursor-pointer rounded-full p-1.5 transition-colors hover:bg-muted ${textClass}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
