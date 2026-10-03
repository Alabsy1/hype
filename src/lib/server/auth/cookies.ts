import "server-only";

import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./constants";

/** Reads the raw session token from the HttpOnly cookie. Null when absent. */
export async function getSessionCookieToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Sets the session cookie: HttpOnly always, Secure in production (plain HTTP
 * in development so local login works), SameSite=Lax, Path=/, with an
 * explicit expiry matching the database session lifetime.
 */
export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Clears the session cookie. Safe to call when no cookie exists. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
