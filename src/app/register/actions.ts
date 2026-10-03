"use server";

import { redirect } from "next/navigation";

import { ConflictError } from "@/lib/server/errors/data-layer-error";
import { setSessionCookie } from "@/lib/server/auth/cookies";
import { registerInputSchema } from "@/lib/server/auth/register.schema";
import { registerCustomerUser } from "@/lib/server/auth/register";
import { createSession } from "@/lib/server/auth/session";
import {
  checkRateLimit,
  getClientIpKey,
  RATE_LIMIT_MESSAGE,
  REGISTER_IP_POLICY,
  resetRateLimit,
} from "@/lib/server/rate-limit";

export interface RegisterState {
  error: string | null;
}

/**
 * Public customer registration. Validates with Zod (field problems return the
 * first human-readable issue), creates a CUSTOMER account — the schema has no
 * role field so privilege escalation via crafted input is impossible — then
 * establishes a session exactly like login and lands on the public homepage.
 * Duplicate emails return an explicit, safe message (no DB details).
 */
export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerInputSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    return { error: typeof first === "string" && first ? first : "Invalid registration details." };
  }

  // Per-IP throttle against mass-account abuse. Checked before any database
  // write; the message reveals nothing account-specific.
  const ipKey = `register:ip:${await getClientIpKey()}`;
  if (!(await checkRateLimit(ipKey, REGISTER_IP_POLICY))) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  try {
    const user = await registerCustomerUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);
    await resetRateLimit(ipKey);
  } catch (error) {
    if (error instanceof ConflictError) {
      return { error: error.message };
    }
    throw error;
  }

  redirect("/");
}
