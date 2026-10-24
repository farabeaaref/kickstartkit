import { z } from "zod";

export const settingsSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name.").max(120, "Name is too long."),
  workspaceName: z.string().trim().min(1, "Enter a workspace name.").max(120, "Name is too long."),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
