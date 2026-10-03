import "server-only";

import type { UserRole } from "@/generated/prisma/client";

/**
 * Safe authenticated-user representation. Contains only the fields the
 * application needs for identity display and role checks. NEVER includes
 * passwordHash, session tokens, or token hashes.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export function toAuthUser(record: {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}): AuthUser {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    role: record.role,
  };
}
