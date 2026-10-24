import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address.").max(254, "Email is too long."));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(72, "Password is too long."),
  next: z.string().optional(),
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name.").max(120, "Name is too long."),
  workspaceName: z.string().trim().min(1, "Enter your agency or studio name.").max(120, "Name is too long."),
  email,
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Use 72 characters or fewer.")
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export type FieldErrors<T> = Partial<Record<keyof T, string[]>>;

export type AuthFormState<T = Record<string, string>> =
  | { status: "idle" }
  | { status: "error"; message?: string; fieldErrors?: FieldErrors<T>; values?: Partial<Record<keyof T, string>> }
  | { status: "check_email"; email: string };

/** Maps Supabase auth errors to copy that is safe and useful to show users. */
export function friendlyAuthError(error: { message?: string; code?: string } | null | undefined): string {
  const code = error?.code ?? "";
  const message = (error?.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "That email and password don't match. Try again or reset your password.";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Please confirm your email first — check your inbox for the link.";
  }
  if (code === "user_already_exists" || message.includes("already registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (code === "weak_password") {
    return "That password is too weak. Try a longer one with letters and numbers.";
  }
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || message.includes("rate limit")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return "Something went wrong. Please try again.";
}
