import "server-only";

import type { UserRole } from "@/generated/prisma/client";

import { prisma } from "@/lib/server/prisma";

export interface SessionWithUser {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastSeenAt: Date | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    isActive: boolean;
  };
}

const sessionWithUserInclude = {
  user: {
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  },
} as const;

export async function createSessionRecord(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<{ id: string; expiresAt: Date }> {
  return prisma.session.create({
    data,
    select: { id: true, expiresAt: true },
  });
}

export async function getSessionWithUserByTokenHash(
  tokenHash: string,
): Promise<SessionWithUser | null> {
  return prisma.session.findUnique({
    where: { tokenHash },
    include: sessionWithUserInclude,
  });
}

/** Revokes one session. Idempotent — missing rows are not an error. */
export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  try {
    await prisma.session.delete({ where: { tokenHash } });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2025"
    ) {
      return;
    }
    throw error;
  }
}

/**
 * Lazy cleanup helper (no background worker in this phase). Returns the
 * number of removed rows. Callers may invoke it opportunistically; expired
 * sessions are additionally deleted when encountered by `getCurrentUser`.
 */
export async function deleteExpiredSessions(now: Date = new Date()): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lte: now } },
  });
  return result.count;
}
