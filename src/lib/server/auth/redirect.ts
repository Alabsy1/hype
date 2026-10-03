// Pure redirect-target validation — no server-only import by design. String
// logic only, so it stays usable from any runtime (Server Actions, server
// components, and potentially future middleware/edge guards).

/**
 * Validates a post-login redirect target. Only same-origin absolute paths are
 * allowed (single leading slash, no backslashes, no control characters),
 * which makes open redirects to external URLs impossible. Falls back to
 * `/dashboard` for anything else.
 */
export function getSafeRedirect(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 500) {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || /[\r\n\t]/.test(value)) return fallback;
  return value;
}
