import type { UploadableFileType } from "./constants";
import { normalizeText } from "./text";

export type ExtractFailureReason = "invalid_file" | "no_text" | "unreadable";

export type ExtractResult =
  { ok: true; text: string; truncated: boolean } | { ok: false; reason: ExtractFailureReason; message: string };

const MESSAGES = {
  invalid: {
    pdf: "This file isn't a valid PDF. Please upload the original PDF or paste the text instead.",
    docx: "This file isn't a valid Word (.docx) document. Older .doc files aren't supported — save it as .docx or paste the text instead.",
    txt: "This file doesn't look like plain text. Please upload a .txt file or paste the text instead.",
  },
  noText: {
    pdf: "We couldn't find any text in this PDF. It may be a scanned image — paste the text instead.",
    docx: "This Word document doesn't contain any text.",
    txt: "This text file is empty.",
  },
  encrypted: "This PDF is password-protected. Remove the password and upload it again, or paste the text instead.",
  unreadable: "We couldn't read this file. It may be damaged — try exporting it again or paste the text instead.",
} as const;

/**
 * Identifies a file from its first bytes (magic numbers). Never trust the file
 * name or the browser-reported MIME type: a renamed executable must not pass.
 */
export function sniffFileType(bytes: Uint8Array): UploadableFileType | "binary" | "unknown" {
  if (bytes.length === 0) return "unknown";

  // PDF: "%PDF-" within the first 1 KB (some generators prepend junk bytes).
  const head = latin1(bytes.subarray(0, 1024));
  if (head.includes("%PDF-")) return "pdf";

  // DOCX is a ZIP container: "PK\x03\x04".
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return "docx";

  return looksLikeText(bytes) ? "txt" : "binary";
}

/** Heuristic: no NUL bytes and very few other control characters in the first 8 KB. */
function looksLikeText(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, 8192);
  let suspicious = 0;
  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte < 0x09 || (byte > 0x0d && byte < 0x20) || byte === 0x7f) suspicious++;
  }
  return suspicious / sample.length < 0.01;
}

function latin1(bytes: Uint8Array): string {
  return new TextDecoder("latin1").decode(bytes);
}

export async function extractText(bytes: Uint8Array, expected: UploadableFileType): Promise<ExtractResult> {
  const detected = sniffFileType(bytes);
  if (detected !== expected) {
    return { ok: false, reason: "invalid_file", message: MESSAGES.invalid[expected] };
  }

  let raw: string;
  try {
    raw = await EXTRACTORS[expected](bytes);
  } catch (error) {
    if (isPasswordError(error)) return { ok: false, reason: "unreadable", message: MESSAGES.encrypted };
    // A ZIP that isn't a Word document, or a corrupt PDF.
    const reason = expected === "docx" ? "invalid_file" : "unreadable";
    return { ok: false, reason, message: reason === "invalid_file" ? MESSAGES.invalid.docx : MESSAGES.unreadable };
  }

  const { text, truncated } = normalizeText(raw);
  if (text.length === 0) return { ok: false, reason: "no_text", message: MESSAGES.noText[expected] };
  return { ok: true, text, truncated };
}

const EXTRACTORS: Record<UploadableFileType, (bytes: Uint8Array) => Promise<string>> = {
  async pdf(bytes) {
    const { extractText: extractPdfText, getDocumentProxy } = await import("unpdf");
    // pdf.js takes ownership of the buffer, so hand it a copy.
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    try {
      const { text } = await extractPdfText(pdf, { mergePages: false });
      return text.join("\n\n");
    } finally {
      await pdf.cleanup();
    }
  },

  async docx(bytes) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return result.value;
  },

  async txt(bytes) {
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      // Not valid UTF-8: most likely a Windows-1252 export (common for transcripts).
      return decodeWindows1252(bytes);
    }
  },
};

/**
 * Node's TextDecoder treats "windows-1252" as ISO-8859-1, which turns € and
 * curly quotes (0x80–0x9F) into control characters. Map that range by hand.
 */
const WINDOWS_1252_HIGH =
  "\u20ac\ufffd\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\ufffd\u017d\ufffd" +
  "\ufffd\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\ufffd\u017e\u0178";

export function decodeWindows1252(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) {
    out += byte >= 0x80 && byte <= 0x9f ? WINDOWS_1252_HIGH[byte - 0x80] : String.fromCharCode(byte);
  }
  return out;
}

function isPasswordError(error: unknown): boolean {
  return error instanceof Error && (error.name === "PasswordException" || /password/i.test(error.message));
}
