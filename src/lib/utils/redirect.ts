const DEFAULT_PATH = "/dashboard";

/**
 * Returns a same-origin relative path that is safe to redirect to after auth.
 * Rejects absolute URLs, protocol-relative URLs (`//evil.com`), backslash
 * tricks (`/\evil.com`) and anything that isn't a plain path.
 */
export function safeNextPath(value: unknown, fallback: string = DEFAULT_PATH): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  try {
    const base = "http://kickstartkit.local";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
