import "server-only";

import type { UserRole } from "@/generated/prisma/client";

import { toAuthUser } from "@/lib/server/dto/auth.dto";
import type { AuthUser } from "@/lib/server/dto/auth.dto";
import { toDataLayerError } from "@/lib/server/errors/data-layer-error";
import { prisma } from "@/lib/server/prisma";

/**
 * Internal user record for authentication. Includes `passwordHash` and must
 * NEVER leave the server auth layer — callers receive AuthUser instead.
 */
export interface InternalUserRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Authentication-only lookup: selects the password hash together with the
 * identity fields. Used exclusively by `authenticateUser`.
 */
export async function getUserByEmailWithPasswordHash(
  email: string,
): Promise<InternalUserRecord | null> {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      role: true,
      isActive: true,
    },
  });
}

/** Safe lookup by id — returns AuthUser (no password hash). */
export async function getAuthUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return toAuthUser(user);
}

/** Records a successful login. Called once per authentication, not per request. */
export async function updateUserLastLogin(id: string): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { lastLoginAt: new Date() },
  });
}

export interface CreateUserInput {
  email: string;
  name: string | null;
  passwordHash: string;
  role: UserRole;
}

/**
 * Creates a user with an explicitly supplied role. Callers (registration,
 * admin bootstrap) decide the role — it is never taken from browser input.
 * Returns AuthUser (no password hash). Duplicate email surfaces as
 * ConflictError via the data-layer normalizer.
 */
export async function createUser(input: CreateUserInput): Promise<AuthUser> {
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash,
        role: input.role,
        isActive: true,
      },
      select: { id: true, email: true, name: true, role: true },
    });
    return toAuthUser(user);
  } catch (error) {
    throw toDataLayerError(error);
  }
}
