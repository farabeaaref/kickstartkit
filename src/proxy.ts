import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except static assets, image optimisation, webhooks, and
    // public client onboarding routes (token-authenticated, no Supabase session).
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|onboard|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
