"use client";

import { AlertCircle, MailCheck } from "lucide-react";
import { useActionState } from "react";

import { signUp } from "@/app/(auth)/actions";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AuthFormState, SignUpInput } from "@/lib/validation/auth";

export function SignUpForm() {
  const [state, formAction] = useActionState<AuthFormState<SignUpInput>, FormData>(signUp, { status: "idle" });

  if (state.status === "check_email") {
    return (
      <Alert variant="success">
        <MailCheck />
        <AlertTitle>Check your inbox</AlertTitle>
        <AlertDescription>
          We sent a confirmation link to <strong>{state.email}</strong>. Click it to activate your workspace.
        </AlertDescription>
      </Alert>
    );
  }

  const errorState = state.status === "error" ? state : null;
  const fieldErrors = errorState?.fieldErrors;
  const values = errorState?.values;

  return (
    <form action={formAction} className="grid gap-5" noValidate>
      {errorState?.message ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{errorState.message}</AlertDescription>
        </Alert>
      ) : null}
      <FormField
        label="Your name"
        name="fullName"
        autoComplete="name"
        placeholder="Alex Rivera"
        required
        defaultValue={values?.fullName ?? ""}
        errors={fieldErrors?.fullName}
      />
      <FormField
        label="Agency or studio name"
        name="workspaceName"
        autoComplete="organization"
        placeholder="Northwind Studio"
        required
        defaultValue={values?.workspaceName ?? ""}
        errors={fieldErrors?.workspaceName}
        hint="This is your workspace. Clients see it on their onboarding page."
      />
      <FormField
        label="Work email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@studio.com"
        required
        defaultValue={values?.email ?? ""}
        errors={fieldErrors?.email}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={fieldErrors?.password}
        hint="At least 8 characters, with a letter and a number."
      />
      <SubmitButton className="w-full" size="lg" pendingLabel="Creating your workspace…">
        Start free trial
      </SubmitButton>
      <p className="text-center text-xs text-muted-foreground">14-day free trial. No credit card required.</p>
    </form>
  );
}
