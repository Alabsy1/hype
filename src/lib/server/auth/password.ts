import "server-only";

import bcrypt from "bcryptjs";

import { ValidationError } from "@/lib/server/errors/data-layer-error";

import {
  BCRYPT_COST_FACTOR,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "./constants";

/**
 * Enforces the password policy. Throws ValidationError (never logs or echoes
 * the password). Maximum length exists because bcrypt silently truncates
 * input beyond 72 bytes.
 */
export function validatePasswordPolicy(password: unknown): asserts password is string {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    throw new ValidationError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    );
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    throw new ValidationError(
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters long.`,
    );
  }
}

/** Hashes a password server-side with bcrypt. Never logs the input or output. */
export async function hashPassword(password: string): Promise<string> {
  validatePasswordPolicy(password);
  return bcrypt.hash(password, BCRYPT_COST_FACTOR);
}

/**
 * Compares a candidate password against a stored hash. Returns false (never
 * throws) for empty inputs or malformed hashes so authentication callers get
 * a uniform boolean.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
