"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";
import {
  friendlyAuthError,
  loginSchema,
  signUpSchema,
  type AuthFormState,
  type LoginInput,
  type SignUpInput,
} from "@/lib/validation/auth";

export async function login(_prev: AuthFormState<LoginInput>, formData: FormData): Promise<AuthFormState<LoginInput>> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? ""),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values: { email: raw.email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return { status: "error", message: friendlyAuthError(error), values: { email: raw.email } };
  }

  redirect(safeNextPath(parsed.data.next));
}

export async function signUp(
  _prev: AuthFormState<SignUpInput>,
  formData: FormData,
): Promise<AuthFormState<SignUpInput>> {
  const raw = {
    fullName: String(formData.get("fullName") ?? ""),
    workspaceName: String(formData.get("workspaceName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { fullName: raw.fullName, workspaceName: raw.workspaceName, email: raw.email };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Read by the `handle_new_user` trigger to create the workspace + profile.
      data: { full_name: parsed.data.fullName, workspace_name: parsed.data.workspaceName },
      emailRedirectTo: `${getPublicEnv().NEXT_PUBLIC_APP_URL}/auth/confirm?next=/dashboard`,
    },
  });
  if (error) {
    return { status: "error", message: friendlyAuthError(error), values };
  }

  // Email confirmation enabled: no session until the user clicks the link.
  if (!data.session) {
    return { status: "check_email", email: parsed.data.email };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
