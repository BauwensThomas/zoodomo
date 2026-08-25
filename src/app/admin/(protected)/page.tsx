import Link from "next/link";
import { headers } from "next/headers";
import {
  Inbox,
  Archive,
  ArchiveRestore,
  RotateCcw,
  Trash2,
  Mail,
  MailOpen,
  Reply,
  Search,
  X,
} from "lucide-react";
import {
  getSupportMessageById,
  listAccounts,
  listArchivedSupportMessages,
  listSentAdminMessages,
  listSupportMessages,
  listTrashedSupportMessages,
  searchSupportMessages,
  resolveRatingRequestContent,
} from "@/lib/mock";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminBroadcastForm } from "./AdminBroadcastForm";
import { OpenPhotoLink } from "./OpenPhotoLink";
import { TabLink } from "@/components/TabLink";
import {
  archiveSupportMessageAction,
  unarchiveSupportMessageAction,
  trashSupportMessageAction,
  restoreSupportMessageAction,
  deleteSupportMessageAction,
  setSupportMessageReadAction,
} from "../actions";
import type { Locale, MessageStatus, SupportReason } from "@/types";

const REASON_LABEL: Record<SupportReason, string> = {
  bug: "Problème technique / bug",
  compte: "Question sur mon compte",
  suggestion: "Suggestion d'amélioration",
  autre: "Autre",
};

type View = "inbox" | "archives" | "corbeille" | "envoyes";

const STATUS_LABEL: Record<MessageStatus, string> = {
  active: "Boîte de réception",
  archived: "Archivé",
  trash: "Corbeille",
};

function statusToView(status: MessageStatus): View {
  return status === "archived" ? "archives" : status === "trash" ? "corbeille" : "inbox";
}

// Page admin volontairement en français uniquement (équipe Zoodomo interne), pas de
// next-intl ici contrairement au reste de l'app.
export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    reply?: string;
    subject?: string;
    replyMessageId?: string;
    q?: string;
  }>;
}) {
  const { view: viewParam, reply, subject, replyMessageId, q } = await searchParams;
  const view: View =
    viewParam === "archives"
      ? "archives"
      : viewParam === "corbeille"
        ? "corbeille"
        : viewParam === "envoyes"
          ? "envoyes"
          : "inbox";
  const isSearching = Boolean(q && q.trim());

  const admin = await createClient();
  const accounts = await listAccounts(admin);
  // Une recherche cherche partout à la fois (boîte de réception, archives, corbeille ET
  // envoyés), indépendamment de l'onglet actif au moment de la soumission : `view` ne sert
  // plus qu'à savoir où revenir une fois la recherche effacée (voir le lien "Effacer" plus
  // bas), pas à restreindre les résultats pendant qu'on cherche.
  const supportMessages = isSearching
    ? await searchSupportMessages(admin, q!)
    : view === "envoyes"
      ? []
      : view === "archives"
        ? await listArchivedSupportMessages(admin)
        : view === "corbeille"
          ? await listTrashedSupportMessages(admin)
          : await listSupportMessages(admin);
  const sentMessagesAll = isSearching || view === "envoyes" ? await listSentAdminMessages(admin) : [];
  const sentMessages = isSearching
    ? sentMessagesAll.filter((m) => {
        const query = q!.trim().toLowerCase();
        return (
          m.subject.toLowerCase().includes(query) ||
          m.body.toLowerCase().includes(query) ||
          m.accountName.toLowerCase().includes(query)
        );
      })
    : sentMessagesAll;
  const accountsById = new Map(accounts.map((a) => [a.id, a]));
  const originalMessage = replyMessageId ? await getSupportMessageById(admin, replyMessageId) : undefined;

  // `resolveRatingRequestContent` lit `account_ratings`, sans policy RLS pour le rôle
  // `authenticated` (voir docs/DECISIONS.md, même correctif déjà appliqué aux onglets
  // Photos/Votes) : un client service_role dédié est nécessaire ici, `admin` (client de
  // session) ne suffit pas. Résolu dans la langue ACTUELLE du compte destinataire (pas celle
  // de l'admin, l'admin reste français uniquement) : reflète ce que le pro verrait s'il
  // ouvrait ce message maintenant, sans que l'admin ait besoin de quitter son propre tableau
  // de bord pour vérifier, demande utilisateur du 2026-08-25.
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const serviceRole = createAdminClient();
  const ratingContentByMessageId = new Map(
    await Promise.all(
      sentMessages
        .filter((m) => m.kind === "avis_demande")
        .map(async (m) => {
          const locale = (accountsById.get(m.account_id)?.langue_interface ?? "fr") as Locale;
          const content = await resolveRatingRequestContent(serviceRole, m.account_id, locale, baseUrl);
          return [m.id, content] as const;
        })
    )
  );

  const tabs: { key: View; href: string; label: string }[] = [
    { key: "inbox", href: "/admin", label: "Boîte de réception" },
    { key: "archives", href: "/admin?view=archives", label: "Archives" },
    { key: "corbeille", href: "/admin?view=corbeille", label: "Corbeille" },
    { key: "envoyes", href: "/admin?view=envoyes", label: "Envoyés" },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="flex items-center gap-2 font-heading text-xl font-medium text-foreground">
          <Inbox className="h-5 w-5" />
          Messages
        </h1>

        <form
          action="/admin"
          method="get"
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="view" value={view} />
          <div className="relative min-w-55 max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Rechercher un message (objet, texte, compte)..."
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
              href={tabs.find((t) => t.key === view)?.href ?? "/admin"}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-foreground px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" />
              Effacer
            </Link>
          )}
        </form>

        {!isSearching && (
          <div className="mt-4 flex gap-1 border-b border-border bg-background">
            {tabs.map((tab) => (
              <TabLink key={tab.key} href={tab.href} active={view === tab.key}>
                {tab.label}
              </TabLink>
            ))}
          </div>
        )}

        {isSearching && (
          <p className="mt-4 text-sm text-foreground">
            {supportMessages.length + sentMessages.length === 0
              ? `Aucun résultat pour "${q}".`
              : `${supportMessages.length + sentMessages.length} résultat${supportMessages.length + sentMessages.length > 1 ? "s" : ""} pour "${q}" (${supportMessages.length} reçu${supportMessages.length > 1 ? "s" : ""}, ${sentMessages.length} envoyé${sentMessages.length > 1 ? "s" : ""}).`}
          </p>
        )}

        {(isSearching ? sentMessages.length > 0 : view === "envoyes") && (
          <div className="mt-4 space-y-3">
            {isSearching && <p className="text-xs font-medium text-foreground">Envoyés</p>}
            {sentMessages.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-sm text-foreground">
                Aucun message envoyé pour le moment.
              </p>
            ) : (
              sentMessages.map((message) => {
                const ratingContent = ratingContentByMessageId.get(message.id);
                const subject = ratingContent?.subject ?? message.subject;
                const body = ratingContent?.body ?? message.body;
                return (
                  <div key={message.id} className="rounded-2xl border border-foreground bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          À {message.accountName}
                        </p>
                        <p className="mt-0.5 font-medium text-foreground">{subject}</p>
                      </div>
                      <p className="shrink-0 text-xs text-foreground">
                        {new Date(message.created_at).toLocaleString("fr", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-foreground">{body}</p>
                    {ratingContent &&
                      (ratingContent.linkUrl ? (
                        <a
                          href={ratingContent.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
                        >
                          {ratingContent.buttonLabel}
                        </a>
                      ) : (
                        <p className="mt-2 text-xs font-medium text-foreground">{ratingContent.buttonLabel}</p>
                      ))}
                  </div>
                );
              })
            )}
          </div>
        )}

        {(isSearching ? supportMessages.length > 0 : view !== "envoyes") && (
          <div className="mt-4 space-y-3">
            {isSearching && <p className="text-xs font-medium text-foreground">Reçus</p>}
            {supportMessages.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-muted/60 p-8 text-center text-sm text-foreground">
                {view === "archives"
                  ? "Aucun message archivé."
                  : view === "corbeille"
                    ? "Corbeille vide."
                    : "Aucun message pour le moment."}
              </p>
            ) : (
              supportMessages.map((message) => {
              const account = accountsById.get(message.account_id);
              const messageView = isSearching ? statusToView(message.status) : view;
              return (
                <div
                  key={message.id}
                  className={`rounded-2xl border p-4 ${
                    !message.read && messageView === "inbox"
                      ? "border-orange-300 bg-orange-100"
                      : "border-foreground bg-card"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        De {account?.nom_affichage ?? "?"}
                      </p>
                      <p className="mt-0.5 font-medium text-foreground">{message.subject}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isSearching && (
                        <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
                          {STATUS_LABEL[message.status]}
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                        {REASON_LABEL[message.reason]}
                      </span>
                      {messageView === "corbeille" ? (
                        <>
                          <form action={restoreSupportMessageAction.bind(null, message.id)}>
                            <button
                              type="submit"
                              aria-label="Restaurer"
                              title="Restaurer"
                              className="cursor-pointer rounded-full p-1.5 text-foreground transition-colors hover:bg-muted"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          </form>
                          <form action={deleteSupportMessageAction.bind(null, message.id)}>
                            <button
                              type="submit"
                              aria-label="Supprimer définitivement"
                              title="Supprimer définitivement"
                              className="cursor-pointer rounded-full p-1.5 text-red-600 transition-colors hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                        </>
                      ) : (
                        <>
                          <Link
                            href={`/admin?reply=${message.account_id}&subject=${encodeURIComponent(`RE : ${message.subject}`)}&replyMessageId=${message.id}#envoyer-un-message`}
                            aria-label="Répondre"
                            title="Répondre"
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full p-1.5 text-foreground transition-colors hover:bg-muted"
                          >
                            <Reply className="h-4 w-4" />
                          </Link>
                          {/* Lu/non lu n'a de sens que dans la boîte de réception : un message
                              archivé est déjà "traité" (retour utilisateur), pas de bascule ici. */}
                          {messageView === "inbox" && (
                            <form action={setSupportMessageReadAction.bind(null, message.id, !message.read)}>
                              <button
                                type="submit"
                                aria-label={message.read ? "Marquer comme non lu" : "Marquer comme lu"}
                                title={message.read ? "Marquer comme non lu" : "Marquer comme lu"}
                                className="cursor-pointer rounded-full p-1.5 text-foreground transition-colors hover:bg-muted"
                              >
                                {message.read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                              </button>
                            </form>
                          )}
                          {messageView === "archives" ? (
                            <form action={unarchiveSupportMessageAction.bind(null, message.id)}>
                              <button
                                type="submit"
                                aria-label="Retirer de l'archive"
                                title="Retirer de l'archive"
                                className="cursor-pointer rounded-full p-1.5 text-foreground transition-colors hover:bg-muted"
                              >
                                <ArchiveRestore className="h-4 w-4" />
                              </button>
                            </form>
                          ) : (
                            <form action={archiveSupportMessageAction.bind(null, message.id)}>
                              <button
                                type="submit"
                                aria-label="Archiver"
                                title="Archiver"
                                className="cursor-pointer rounded-full p-1.5 text-foreground transition-colors hover:bg-muted"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            </form>
                          )}
                          <form action={trashSupportMessageAction.bind(null, message.id)}>
                            <button
                              type="submit"
                              aria-label="Mettre à la corbeille"
                              title="Mettre à la corbeille"
                              className="cursor-pointer rounded-full p-1.5 text-foreground transition-colors hover:bg-muted"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-foreground">{message.body}</p>
                  {message.photo_url && (
                    <div className="mt-2">
                      <OpenPhotoLink
                        photoUrl={message.photo_url}
                        alt="Capture d'écran jointe par le pro"
                        className="h-24 w-24 object-cover transition-opacity hover:opacity-80"
                      />
                    </div>
                  )}
                  <p className="mt-2 text-xs text-foreground">
                    {new Date(message.created_at).toLocaleString("fr", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                );
              })
            )}
          </div>
        )}
      </section>

      <div id="envoyer-un-message">
        {/* `key` ici (pas seulement sur le `<form>` interne) : force React à recréer tout le
            composant, `useState(initialTarget ?? "tous")` compris, à chaque nouveau clic sur
            "Répondre". Un `key` posé plus profondément ne réinitialise pas les hooks du
            composant qui le porte, seulement ceux d'un enfant remonté, voir docs/DECISIONS.md. */}
        <AdminBroadcastForm
          key={`${reply ?? ""}-${subject ?? ""}-${replyMessageId ?? ""}`}
          accounts={accounts.map((a) => ({ id: a.id, nom: a.nom_affichage, langue_interface: a.langue_interface }))}
          initialTarget={reply}
          initialSubject={subject}
          initialReplyMessageId={replyMessageId}
          originalMessage={
            originalMessage
              ? {
                  fromName: accountsById.get(originalMessage.account_id)?.nom_affichage ?? "?",
                  subject: originalMessage.subject,
                  body: originalMessage.body,
                  photoUrl: originalMessage.photo_url,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
