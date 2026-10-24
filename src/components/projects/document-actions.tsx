"use client";

import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteDocument, processDocument } from "@/app/(dashboard)/projects/actions";
import { Button } from "@/components/ui/button";

export function DocumentActions({
  documentId,
  fileName,
  canRetry,
}: {
  documentId: string;
  fileName: string;
  canRetry: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<"retry" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(kind: "retry" | "delete") {
    if (kind === "delete" && !window.confirm(`Delete “${fileName}”? This can't be undone.`)) return;
    setBusy(kind);
    setError(null);
    startTransition(async () => {
      const result = kind === "retry" ? await processDocument(documentId) : await deleteDocument(documentId);
      if (!result.ok && kind === "delete") setError(result.message);
      setBusy(null);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      {error ? <span className="mr-2 text-xs text-destructive">{error}</span> : null}
      {canRetry ? (
        <Button variant="ghost" size="sm" onClick={() => run("retry")} disabled={pending}>
          {busy === "retry" ? <Loader2 className="animate-spin" /> : <RotateCcw />}
          Try again
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-destructive"
        onClick={() => run("delete")}
        disabled={pending}
        aria-label={`Delete ${fileName}`}
      >
        {busy === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />}
      </Button>
    </div>
  );
}
