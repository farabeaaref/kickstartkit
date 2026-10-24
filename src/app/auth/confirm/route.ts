import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

const otpTypes = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;

const querySchema = z.object({
  token_hash: z.string().min(1).max(512),
  type: z.enum(otpTypes),
  next: z.string().optional(),
});

/**
 * Email confirmation callback. Configure the Supabase "Confirm signup" email
 * template to link to:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
 */
export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  const failUrl = new URL("/login?error=confirm_failed", request.url);
  if (!parsed.success) return NextResponse.redirect(failUrl);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: parsed.data.token_hash,
    type: parsed.data.type as EmailOtpType,
  });
  if (error) return NextResponse.redirect(failUrl);

  return NextResponse.redirect(new URL(safeNextPath(parsed.data.next), request.url));
}
