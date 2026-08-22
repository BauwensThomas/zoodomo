import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

// Renommé `middleware.ts` -> `proxy.ts` (Next.js 16, `middleware` déprécié), voir
// docs/DECISIONS.md et node_modules/next/dist/docs/.../proxy.md.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Exclut les assets statiques/images/favicon : pas besoin d'y rafraîchir une session.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
