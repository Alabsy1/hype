import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { SESSION_MAX_AGE_MS } from "./constants";
import {
  createSessionRecord,
  deleteSessionByTokenHash,
} from "@/lib/server/repositories/sessions.repository";

/**
 * Generates a cryptographically secure random session token (256 bits,
 * base64url). The raw token lives only in the HttpOnly cookie — it is never
 * persisted. Uses Node `randomBytes`, never `Math.random()`.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hashes a session token for database storage/lookup. SHA-256 is appropriate
 * here (unlike passwords): the token has 256 bits of entropy, so the hash
 * only needs preimage resistance and fast equality lookup, not slownness.
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

/**
 * Creates a fixed-duration database session for a user. Returns the raw token
 * (to be placed in the HttpOnly cookie) and its expiry. Only the token hash
 * is stored in `Session.tokenHash`.
 */
export async function createSession(userId: string): Promise<CreatedSession> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
  await createSessionRecord({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });
  return { token, expiresAt };
}

/** Revokes the session identified by a raw cookie token. Safe to call twice. */
export async function revokeSessionByToken(token: string): Promise<void> {
  if (!token) return;
  await deleteSessionByTokenHash(hashSessionToken(token));
}
