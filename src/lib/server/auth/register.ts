import "server-only";

import type { AuthUser } from "@/lib/server/dto/auth.dto";
import { ConflictError } from "@/lib/server/errors/data-layer-error";
import { hashPassword, verifyPassword } from "@/lib/server/auth/password";
import {
  createUser,
  getUserByEmailWithPasswordHash,
  updateUserLastLogin,
} from "@/lib/server/repositories/users.repository";

/**
 * Precomputed bcrypt hash of a random value that corresponds to no real
 * account. Compared (and discarded) when checking a duplicate registration
 * would otherwise return instantly, so the timing of "email taken" versus a
 * successful hash does not become a precise oracle. (The duplicate message
 * itself is intentionally explicit per product requirements.)
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$J/8vBGDi.Z3arZlDF8GESuFpqmL.7yba.uidJ94tuOfQWxMbCdxO2";

export interface RegisterCustomerInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Registers a public customer account.
 *
 * - Normalizes the email (trim + lowercase), consistent with login.
 * - Rejects duplicate emails with an explicit, safe message (no DB details).
 * - Hashes with the shared bcrypt implementation (policy enforced inside).
 * - Assigns role CUSTOMER unconditionally — there is no role input.
 * - Returns AuthUser (no passwordHash) and stamps lastLoginAt, matching the
 *   login path, so the caller can immediately establish a session.
 */
export async function registerCustomerUser(input: RegisterCustomerInput): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  const existing = await getUserByEmailWithPasswordHash(email);
  if (existing) {
    // Keep timing roughly uniform whether or not the account exists.
    await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
    throw new ConflictError("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email,
    name,
    passwordHash,
    role: "CUSTOMER",
  });
  await updateUserLastLogin(user.id);
  return user;
}
