import { cookies } from "next/headers";
import { listAccounts } from "./store";

export const SESSION_COOKIE_NAME = "zoodomo_session";

export async function getSessionAccount() {
  const store = await cookies();
  const accountId = store.get(SESSION_COOKIE_NAME)?.value;
  if (!accountId) return null;
  return listAccounts().find((a) => a.id === accountId) ?? null;
}
