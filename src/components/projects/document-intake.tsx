"use client";

import { AlertCircle, CheckCircle2, ClipboardPaste, FileUp, Loader2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import {
  createDocumentUpload,
  createPastedDocument,
  processDocument,
  type PasteTextState,
} from "@/app/(dashboard)/projects/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCEPT_ATTRIBUTE,
  MAX_SOURCE_FILE_BYTES,
  MIN_PASTED_TEXT_CHARS,
  SOURCE_DOCUMENTS_BUCKET,
  fileTypeFromName,
} from "@/lib/documents/constants";
import { createClient } from "@/lib/supabase/client";
import { cn, formatBytes } from "@/lib/utils";

type UploadPhase =
  | { kind: "idle" }
  | { kind: "uploading"; fileName: string }
  | { kind: "processing"; fileName: string }
  | { kind: "done"; fileName: string }
  | { kind: "error"; message: string };

export function DocumentIntake({ projectId }: { projectId: string }) {
  return (
    <Tabs defaultValue="upload">
      <TabsList className="w-full sm:w-fit">
        <TabsTrigger value="upload">
          <FileUp /> Upload file
        </TabsTrigger>
        <TabsTrigger value="paste">
          <ClipboardPaste /> Paste text
        </TabsTrigger>
      </TabsList>
      <TabsContent value="upload">
        <FileUploader projectId={projectId} />
      </TabsContent>
      <TabsContent value="paste">
        <PasteTextForm projectId={projectId} />
      </TabsContent>
    </Tabs>
  );
}

function FileUploader({ projectId }: { projectId: string }) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<UploadPhase>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const busy = phase.kind === "uploading" || phase.kind === "processing";

  async function handleFile(file: File) {
    // Client-side checks are for fast feedback only; the server re-validates everything.
    if (!fileTypeFromName(file.name)) {
      setPhase({ kind: "error", message: "Upload a PDF, DOCX, or TXT file." });
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      setPhase({ kind: "error", message: `Files must be ${formatBytes(MAX_SOURCE_FILE_BYTES)} or smaller.` });
      return;
    }
    if (file.size === 0) {
      setPhase({ kind: "error", message: "This file is empty." });
      return;
    }

    setPhase({ kind: "uploading", fileName: file.name });
    const start = await createDocumentUpload({ projectId, fileName: file.name, fileSize: file.size });
    if (!start.ok) {
      setPhase({ kind: "error", message: start.message });
      return;
    }

    const { error: uploadError } = await createClient()
      .storage.from(SOURCE_DOCUMENTS_BUCKET)
      .uploadToSignedUrl(start.path, start.token, file, { contentType: start.contentType });
    if (uploadError) {
      setPhase({ kind: "error", message: "The upload didn't finish. Check your connection and try again." });
      router.refresh();
      return;
    }

    setPhase({ kind: "processing", fileName: file.name });
    const result = await processDocument(start.documentId);
    setPhase(result.ok ? { kind: "done", fileName: file.name } : { kind: "error", message: result.message });
    router.refresh();
  }

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void handleFile(file);
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && !busy) void handleFile(file);
  }

  return (
    <div className="grid gap-3">
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-accent" : "border-input hover:border-primary/50 hover:bg-muted/50",
          busy && "pointer-events-none opacity-70",
        )}
      >
        {busy ? (
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        ) : (
          <UploadCloud className="size-8 text-primary" aria-hidden />
        )}
        <span className="font-medium">
          {phase.kind === "uploading"
            ? `Uploading ${phase.fileName}…`
            : phase.kind === "processing"
              ? `Reading ${phase.fileName}…`
              : "Drop a file here, or click to choose"}
        </span>
        <span className="text-sm text-muted-foreground">
          Proposal, brief, contract, email thread, or call transcript · PDF, DOCX, or TXT up to{" "}
          {formatBytes(MAX_SOURCE_FILE_BYTES)}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          disabled={busy}
          onChange={onInputChange}
          data-testid="document-file-input"
        />
      </label>

      {phase.kind === "done" ? (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertDescription>
            {phase.fileName} is ready. You can add more documents or review the text below.
          </AlertDescription>
        </Alert>
      ) : null}
      {phase.kind === "error" ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{phase.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

function PasteTextForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<PasteTextState, FormData>(createPastedDocument, { status: "idle" });

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid gap-2">
        <Label htmlFor="pasted-text">Paste the document text</Label>
        <Textarea
          id="pasted-text"
          name="text"
          rows={8}
          required
          minLength={MIN_PASTED_TEXT_CHARS}
          className="max-h-96 field-sizing-fixed"
          placeholder="Paste an email thread, call notes, a proposal, or anything that describes the project…"
        />
      </div>
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      {state.status === "success" ? (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertDescription>Text saved.</AlertDescription>
        </Alert>
      ) : null}
      <div>
        <SubmitButton pendingLabel="Saving…">Save text</SubmitButton>
      </div>
    </form>
  );
}
