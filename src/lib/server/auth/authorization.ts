import "server-only";

import type { UserRole } from "@/generated/prisma/client";

import type { AuthUser } from "@/lib/server/dto/auth.dto";
import { toAuthUser } from "@/lib/server/dto/auth.dto";
import { getSessionCookieToken } from "@/lib/server/auth/cookies";
import { ForbiddenError, UnauthenticatedError } from "@/lib/server/auth/errors";
import { hashSessionToken } from "@/lib/server/auth/session";
import { logSecurityEvent } from "@/lib/server/security-log";
import {
  deleteSessionByTokenHash,
  getSessionWithUserByTokenHash,
} from "@/lib/server/repositories/sessions.repository";

import { getSafeRedirect } from "./redirect";

export { getSafeRedirect };

/**
 * Resolves the current request's user from the session cookie:
 * cookie token → SHA-256 → Session.tokenHash lookup → expiry check →
 * user load. Returns null for ordinary unauthenticated visitors (never
 * throws). Expired sessions are deleted lazily when encountered. Inactive
 * users are treated as unauthenticated without revealing why.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionCookieToken();
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const session = await getSessionWithUserByTokenHash(tokenHash);
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await deleteSessionByTokenHash(tokenHash);
    return null;
  }

  if (!session.user.isActive) return null;
  return toAuthUser(session.user);
}

/** Like `getCurrentUser` but throws `UnauthenticatedError` when signed out. */
export async function requireSession(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

/** Pure role predicate — no I/O, safe to use anywhere server-side. */
export function hasRole(user: AuthUser, roles: UserRole | readonly UserRole[]): boolean {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(user.role);
}

/** Type-guard for the primary administrative role. */
export function isAdmin(user: AuthUser | null): user is AuthUser {
  return user !== null && user.role === "ADMIN";
}

/**
 * Pure role assertion (no I/O): throws `ForbiddenError` for a user lacking
 * every listed role, logging the denial with required vs actual role only —
 * never identity. Split out from `requireRole` so the denial branch is
 * directly unit-testable without session/cookie context.
 */
export function assertRole(user: AuthUser, roles: readonly UserRole[]): void {
  if (!hasRole(user, roles)) {
    logSecurityEvent("auth.denied", { required: [...roles].join(","), actual: user.role });
    throw new ForbiddenError();
  }
}

/**
 * Requires an authenticated session whose role is in `roles`, otherwise
 * throws `UnauthenticatedError` (signed out) or `ForbiddenError` (wrong
 * role). The server remains the final authority — never gate on client state.
 */
export async function requireRole(...roles: UserRole[]): Promise<AuthUser> {
  const user = await requireSession();
  assertRole(user, roles);
  return user;
}

/** Requires the ADMIN role (initial Dashboard foundation). */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole("ADMIN");
}

/**
 * Computes where a freshly authenticated user should land.
 *
 * - Admins keep their requested destination (default `/dashboard`).
 * - Non-admins are never sent into `/dashboard`: a returnTo pointing there
 *   (or beneath it) is rewritten to `/`, and the default is `/`. Seeing the
 *   403 page right after login would be confusing, and no redirect may ever
 *   escalate privilege — the dashboard gate re-checks the role regardless.
 */
export function getPostLoginRedirect(user: AuthUser, returnTo: unknown): string {
  const target = getSafeRedirect(returnTo);
  const isDashboardTarget = target === "/dashboard" || target.startsWith("/dashboard/");
  if (user.role === "ADMIN") return target;
  if (isDashboardTarget) return "/";
  return target;
}
