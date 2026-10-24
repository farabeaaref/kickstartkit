import { MAX_STORED_TEXT_CHARS } from "./constants";

/**
 * Cleans extracted or pasted text so it is safe to store and pleasant to read:
 * normalises line endings, strips control characters, trims trailing spaces,
 * collapses runs of blank lines, and caps the length.
 */
export function normalizeText(input: string, maxChars: number = MAX_STORED_TEXT_CHARS) {
  const cleaned = input
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    // Control characters except tab and newline (includes NUL, which Postgres rejects).
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleaned.length <= maxChars) return { text: cleaned, truncated: false };
  return { text: cleaned.slice(0, maxChars).trimEnd(), truncated: true };
}

/** Counts words for display ("~1,240 words"). */
export function countWords(text: string): number {
  const matches = text.match(/\S+/g);
  return matches ? matches.length : 0;
}
