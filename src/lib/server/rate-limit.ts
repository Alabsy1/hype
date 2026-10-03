import "server-only";

import { headers } from "next/headers";

import { prisma } from "@/lib/server/prisma";
import { logSecurityEvent } from "@/lib/server/security-log";

export interface RateLimitPolicy {
  /** Maximum attempts admitted inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/** Login attempts per normalized email: blunts per-account brute force. */
export const LOGIN_EMAIL_POLICY: RateLimitPolicy = { limit: 10, windowMs: 10 * 60 * 1000 };

/** Login attempts per client IP: blunts credential stuffing across emails. */
export const LOGIN_IP_POLICY: RateLimitPolicy = { limit: 60, windowMs: 10 * 60 * 1000 };

/** Registrations per client IP: blunts mass-account abuse. */
export const REGISTER_IP_POLICY: RateLimitPolicy = { limit: 10, windowMs: 60 * 60 * 1000 };

export const RATE_LIMIT_MESSAGE = "Too many attempts. Please try again later.";

/**
 * Best-effort client IP for abuse keying. Behind Vercel/proxies this is the
 * leftmost `x-forwarded-for` entry, which clients can spoof — so IP keys are
 * only ever a second layer behind email-scoped keys, never the sole gate.
 * Returns "unknown" (one shared, stricter bucket) when no header is present.
 */
export async function getClientIpKey(): Promise<string> {
  try {
    const store = await headers();
    const forwarded = store.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim();
    return ip && ip.length <= 64 ? ip : "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Durable sliding-window check backed by Neon (not process memory), so limits
 * hold across serverless instances. On success the caller should reset the
 * key (see `resetRateLimit`) so legitimate users are never wedged by their
 * own earlier typos. No accounts are ever locked.
 *
 * Failure mode: if the counter itself errors, the check fails OPEN (auth
 * proceeds) — availability wins over a counter write, and the dashboard
 * actions that matter remain role-gated regardless. This is documented, not
 * silent: the error path is intentional.
 */
export async function checkRateLimit(key: string, policy: RateLimitPolicy): Promise<boolean> {
  try {
    const since = new Date(Date.now() - policy.windowMs);
    // Opportunistic, key-scoped prune: rows outside every window are garbage.
    await prisma.rateLimitEvent.deleteMany({ where: { key, createdAt: { lt: since } } });
    const count = await prisma.rateLimitEvent.count({ where: { key, createdAt: { gte: since } } });
    if (count >= policy.limit) {
      logSecurityEvent("auth.throttled", { scope: key.split(":").slice(0, 2).join(":") });
      return false;
    }
    await prisma.rateLimitEvent.create({ data: { key } });
    return true;
  } catch {
    return true;
  }
}

/** Clears a key's window (called after the legitimate action succeeds). */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await prisma.rateLimitEvent.deleteMany({ where: { key } });
  } catch {
    // Best-effort: a stale counter decays out of the window on its own.
  }
}
