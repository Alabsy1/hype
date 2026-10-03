import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-safe request hardening (no Node APIs, no database, no cookies read).
 * Attaches a per-request CSP nonce plus baseline security headers to every
 * matched response. Auth/session enforcement stays in server components and
 * Server Actions — this middleware never makes access decisions.
 */
export function middleware(request: NextRequest) {
  // Unpredictable per-request nonce (hex is fine — it only needs uniqueness).
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    // No <style> tags and no style props exist in the app (audited), so
    // style-src stays strict. Revisit if inline styles are ever introduced.
    "style-src 'self'",
    // Local images + next/image optimizer (same origin) + data: URLs for
    // generated blur placeholders.
    "img-src 'self' data:",
    // next/font is self-hosted under /_next/static.
    "font-src 'self'",
    // Server Actions POST back to the same origin.
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Legacy frame-busting backup; CSP frame-ancestors is the real control.
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Camera/mic/location are never needed; payment is omitted so a future
  // checkout integration cannot be silently broken by this header.
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  // Inert over plain HTTP (browsers ignore it there); enforced on HTTPS.
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  return response;
}

// Everything except static assets, the image optimizer, and font/image files.
export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2?)$).*)",
};
