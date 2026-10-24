"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { settingsSchema, type SettingsInput } from "@/lib/validation/settings";

export type SettingsFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message?: string; fieldErrors?: Partial<Record<keyof SettingsInput, string[]>> };

export async function updateSettings(_prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse({
    fullName: formData.get("fullName"),
    workspaceName: formData.get("workspaceName"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const [profile, workspace] = await Promise.all([
    supabase.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", user.id),
    supabase.from("workspaces").update({ name: parsed.data.workspaceName }).eq("id", user.workspace.id),
  ]);
  if (profile.error || workspace.error) {
    return { status: "error", message: "We couldn't save your changes. Please try again." };
  }

  revalidatePath("/", "layout");
  return { status: "success" };
}
