import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
  workspace: { id: string; name: string };
};

/**
 * Data Access Layer entry point. Verifies the session JWT (getClaims) and
 * loads the profile + workspace through RLS. Memoised per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, workspace:workspaces!profiles_workspace_id_fkey(id, name)")
    .eq("id", claims.sub)
    .maybeSingle();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  if (!profile?.workspace) {
    // Signup trigger guarantees a workspace; a missing one means data drift.
    throw new Error("Your account has no workspace. Please contact support.");
  }

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    fullName: profile.full_name,
    workspace: { id: profile.workspace.id, name: profile.workspace.name },
  };
});

/** Use at the top of every protected page, action and route handler. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
