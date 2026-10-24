"use client";

import { AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { login } from "@/app/(auth)/actions";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AuthFormState, LoginInput } from "@/lib/validation/auth";

const URL_ERRORS: Record<string, string> = {
  confirm_failed: "That confirmation link is invalid or has expired. Try logging in, or sign up again.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction] = useActionState<AuthFormState<LoginInput>, FormData>(login, { status: "idle" });

  const urlError = URL_ERRORS[searchParams.get("error") ?? ""];
  const errorState = state.status === "error" ? state : null;
  const message = errorState?.message ?? (state.status === "idle" ? urlError : undefined);

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {message ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@studio.com"
        required
        defaultValue={errorState?.values?.email ?? ""}
        errors={errorState?.fieldErrors?.email}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={errorState?.fieldErrors?.password}
      />
      <SubmitButton className="w-full" size="lg" pendingLabel="Logging in…">
        Log in
      </SubmitButton>
    </form>
  );
}
