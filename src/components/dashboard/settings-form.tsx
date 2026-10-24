"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useActionState } from "react";

import { updateSettings, type SettingsFormState } from "@/app/(dashboard)/settings/actions";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SettingsForm({ fullName, workspaceName }: { fullName: string; workspaceName: string }) {
  const [state, formAction] = useActionState<SettingsFormState, FormData>(updateSettings, { status: "idle" });
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="grid gap-5">
      {state.status === "success" ? (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertDescription>Changes saved.</AlertDescription>
        </Alert>
      ) : null}
      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <FormField label="Your name" name="fullName" defaultValue={fullName} required errors={fieldErrors?.fullName} />
      <FormField
        label="Workspace name"
        name="workspaceName"
        defaultValue={workspaceName}
        required
        errors={fieldErrors?.workspaceName}
        hint="Shown to clients on their onboarding page."
      />
      <div>
        <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  );
}
