"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { createProject, type CreateProjectState } from "@/app/(dashboard)/projects/actions";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProjectForm() {
  const [state, formAction] = useActionState<CreateProjectState, FormData>(createProject, { status: "idle" });
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

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Project name"
          name="projectName"
          placeholder="Brand refresh & launch video"
          required
          autoFocus
          defaultValue={values?.projectName ?? ""}
          errors={fieldErrors?.projectName}
        />
        <FormField
          label="Client name"
          name="clientName"
          placeholder="Acme Coffee Co."
          required
          defaultValue={values?.clientName ?? ""}
          errors={fieldErrors?.clientName}
        />
      </div>

      <FormField
        label="Due date (optional)"
        name="dueDate"
        type="date"
        className="sm:max-w-60"
        defaultValue={values?.dueDate ?? ""}
        errors={fieldErrors?.dueDate}
        hint="When you need everything from the client to start work."
      />

      <div className="grid gap-2">
        <Label htmlFor="description">Short description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          placeholder="What you're delivering, in a sentence or two."
          defaultValue={values?.description ?? ""}
          aria-invalid={fieldErrors?.description ? true : undefined}
        />
        {fieldErrors?.description ? <p className="text-sm text-destructive">{fieldErrors.description[0]}</p> : null}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost">
          <Link href="/dashboard">Cancel</Link>
        </Button>
        <SubmitButton pendingLabel="Creating project…">Create project</SubmitButton>
      </div>
    </form>
  );
}
