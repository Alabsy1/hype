import "server-only";

/**
 * Minimal security audit logging. Emits single-line server log entries for
 * security-relevant denials only — never for routine successes or failures.
 *
 * Privacy contract: context values must NEVER contain emails, IPs, passwords,
 * hashes, tokens, cookies, connection strings, or any other identifier or
 * secret. Callers pass coarse, non-identifying facts only (action names,
 * policy names, required vs actual roles).
 */
export type SecurityEvent = "auth.denied" | "auth.throttled";

export function logSecurityEvent(event: SecurityEvent, context: Record<string, string>): void {
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(context)) {
    if (/password|hash|token|cookie|secret|url|email|ip|address/i.test(key)) continue;
    safe[key] = value;
  }
  console.warn(`[security] ${new Date().toISOString()} ${event} ${JSON.stringify(safe)}`);
}
