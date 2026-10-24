import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { getPublicEnv, parseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role client. BYPASSES RLS — only use in trusted server code (token
 * onboarding routes, webhooks, cron) and always scope queries explicitly.
 * Never import this from a Client Component.
 */
export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = parseEnv(z.object({ SUPABASE_SERVICE_ROLE_KEY: z.string().min(1) }), {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  return createClient<Database>(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
