import "server-only";

import { toAuthUser } from "@/lib/server/dto/auth.dto";
import type { AuthUser } from "@/lib/server/dto/auth.dto";
import { InvalidCredentialsError } from "@/lib/server/auth/errors";
import { verifyPassword } from "@/lib/server/auth/password";
import {
  getUserByEmailWithPasswordHash,
  updateUserLastLogin,
} from "@/lib/server/repositories/users.repository";

/**
 * Precomputed bcrypt hash of a random value that corresponds to no real
 * account. Compared (and discarded) when the email is unknown or the account
 * is inactive so that "user does not exist" takes approximately as long as a
 * real password verification — blunting account-enumeration timing probes.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$J/8vBGDi.Z3arZlDF8GESuFpqmL.7yba.uidJ94tuOfQWxMbCdxO2";

/**
 * Authenticates a user by email + password.
 *
 * - Normalizes the email (trim + lowercase) before lookup.
 * - Rejects unknown users AND inactive accounts with the same generic
 *   `InvalidCredentialsError` — never reveals which check failed.
 * - Returns a safe AuthUser (no passwordHash). Updates `lastLoginAt` once per
 *   successful login. Never logs credentials.
 */
export async function authenticateUser(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const record = await getUserByEmailWithPasswordHash(normalizedEmail);

  if (!record || !record.isActive) {
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    throw new InvalidCredentialsError();
  }

  const valid = await verifyPassword(password, record.passwordHash);
  if (!valid) {
    throw new InvalidCredentialsError();
  }

  await updateUserLastLogin(record.id);
  return toAuthUser(record);
}
