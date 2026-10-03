"use server";

import { redirect } from "next/navigation";

import { authenticateUser } from "@/lib/server/auth/authenticate";
import { getPostLoginRedirect } from "@/lib/server/auth/authorization";
import {
  clearSessionCookie,
  getSessionCookieToken,
  setSessionCookie,
} from "@/lib/server/auth/cookies";
import { InvalidCredentialsError } from "@/lib/server/auth/errors";
import { loginInputSchema } from "@/lib/server/auth/login.schema";
import { createSession, revokeSessionByToken } from "@/lib/server/auth/session";
import {
  checkRateLimit,
  getClientIpKey,
  LOGIN_EMAIL_POLICY,
  LOGIN_IP_POLICY,
  RATE_LIMIT_MESSAGE,
  resetRateLimit,
} from "@/lib/server/rate-limit";

export interface LoginState {
  error: string | null;
}

const GENERIC_LOGIN_ERROR = "Invalid credentials.";

/**
 * Single login entry point for the whole site. Validates input with Zod,
 * authenticates against the database, creates a fixed-duration session, sets
 * the HttpOnly cookie, and redirects. Every failure — malformed input,
 * unknown email, wrong password, inactive account — returns the same generic
 * message so the response never leaks which check failed.
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawReturnTo = formData.get("returnTo");
  const parsed = loginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    returnTo: typeof rawReturnTo === "string" ? rawReturnTo : undefined,
  });
  if (!parsed.success) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  // Abuse protection runs BEFORE password verification: throttled callers
  // never reach bcrypt, and the throttle message is identical for known and
  // unknown emails so it reveals nothing about account existence.
  const emailKey = `login:email:${parsed.data.email}`;
  const ipKey = `login:ip:${await getClientIpKey()}`;
  const [emailAllowed, ipAllowed] = await Promise.all([
    checkRateLimit(emailKey, LOGIN_EMAIL_POLICY),
    checkRateLimit(ipKey, LOGIN_IP_POLICY),
  ]);
  if (!emailAllowed || !ipAllowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  try {
    const user = await authenticateUser(parsed.data.email, parsed.data.password);
    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);
    // Success resets the per-email window so earlier typos never wedge a
    // legitimate user. The IP window decays on its own.
    await resetRateLimit(emailKey);
    // Role-aware landing: admins keep their destination, everyone else is
    // kept out of /dashboard even if returnTo points there.
    const destination = getPostLoginRedirect(user, parsed.data.returnTo);
    redirect(destination);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return { error: GENERIC_LOGIN_ERROR };
    }
    throw error;
  }
}

/**
 * Server-side logout. Revokes the database session (idempotent), clears the
 * cookie, and returns to the login page. Safe to call with no cookie, an
 * expired session, or an already-deleted session — revocation failures never
 * leak; the cookie is always cleared.
 */
export async function logoutAction(): Promise<void> {
  const token = await getSessionCookieToken();
  if (token) {
    try {
      await revokeSessionByToken(token);
    } catch {
      // Revocation best-effort: the cookie below is cleared regardless.
    }
  }
  await clearSessionCookie();
  redirect("/login");
}
