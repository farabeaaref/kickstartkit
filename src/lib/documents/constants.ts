export const SOURCE_DOCUMENTS_BUCKET = "source-documents";

/** Matches the bucket's file_size_limit in the init migration. */
export const MAX_SOURCE_FILE_BYTES = 10 * 1024 * 1024;

/** Upper bound on extracted/pasted text we store (≈ 50k tokens). AI truncation happens later. */
export const MAX_STORED_TEXT_CHARS = 200_000;

/** Pasted text shorter than this is almost certainly not a project document. */
export const MIN_PASTED_TEXT_CHARS = 40;

export const UPLOADABLE_FILE_TYPES = {
  pdf: { extension: "pdf", mimeType: "application/pdf", label: "PDF" },
  docx: {
    extension: "docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "Word (DOCX)",
  },
  txt: { extension: "txt", mimeType: "text/plain", label: "Text (TXT)" },
} as const;

export type UploadableFileType = keyof typeof UPLOADABLE_FILE_TYPES;
export type SourceFileType = UploadableFileType | "pasted_text";

export const ACCEPT_ATTRIBUTE = Object.values(UPLOADABLE_FILE_TYPES)
  .flatMap((t) => [`.${t.extension}`, t.mimeType])
  .join(",");

/** Derives the file type from the file name's extension (case-insensitive). */
export function fileTypeFromName(fileName: string): UploadableFileType | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext || ext === fileName.toLowerCase()) return null;
  const match = (Object.keys(UPLOADABLE_FILE_TYPES) as UploadableFileType[]).find(
    (key) => UPLOADABLE_FILE_TYPES[key].extension === ext,
  );
  return match ?? null;
}
