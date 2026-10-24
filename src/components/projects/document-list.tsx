import { ClipboardPaste, FileText } from "lucide-react";

import type { SourceDocumentView } from "@/lib/projects/queries";
import { UPLOADABLE_FILE_TYPES, type UploadableFileType } from "@/lib/documents/constants";
import { formatRelativeTime } from "@/lib/utils";

import { DocumentActions } from "./document-actions";
import { ExtractionStatusBadge } from "./status-badge";

export function DocumentList({ documents }: { documents: SourceDocumentView[] }) {
  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
        No documents yet. Upload the proposal or brief above — the more context, the better the checklist.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-xl border" aria-label="Source documents">
      {documents.map((doc) => (
        <DocumentRow key={doc.id} doc={doc} />
      ))}
    </ul>
  );
}

function DocumentRow({ doc }: { doc: SourceDocumentView }) {
  const isPasted = doc.fileType === "pasted_text";
  const Icon = isPasted ? ClipboardPaste : FileText;
  const typeLabel = isPasted ? "Pasted text" : UPLOADABLE_FILE_TYPES[doc.fileType as UploadableFileType]?.label;
  const canRetry = !isPasted && doc.hasFile && doc.status !== "extracted";

  return (
    <li className="px-4 py-3.5" data-testid="document-row">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{doc.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {typeLabel} · added {formatRelativeTime(doc.createdAt)}
            {doc.status === "extracted" ? ` · ${doc.wordCount.toLocaleString("en-US")} words` : null}
          </p>
        </div>
        <ExtractionStatusBadge status={doc.status} />
        <DocumentActions documentId={doc.id} fileName={doc.fileName} canRetry={canRetry} />
      </div>

      {doc.status === "failed" && doc.error ? (
        <p className="mt-2 text-sm text-destructive sm:pl-12" role="status">
          {doc.error}
        </p>
      ) : null}

      {doc.status === "extracted" && doc.text ? (
        <details className="group mt-2 sm:pl-12">
          <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
            View extracted text
          </summary>
          <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
            {doc.text}
          </div>
        </details>
      ) : null}
    </li>
  );
}
