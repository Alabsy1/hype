"use server";

import { revalidatePath } from "next/cache";

import { isAuthError } from "@/lib/server/auth/errors";
import { requireAdmin } from "@/lib/server/auth/authorization";
import {
  actionFail,
  actionOk,
  toActionState,
  type ActionState,
} from "@/lib/server/dashboard/action";
import { deleteSetting, setSetting } from "@/lib/server/repositories/settings.repository";
import {
  HOMEPAGE_FEATURED_DEPARTMENT_KEY,
  homepageFeaturedDepartmentSchema,
} from "@/lib/server/homepage";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function ensureAdmin(): Promise<ActionState | null> {
  try {
    await requireAdmin();
    return null;
  } catch (error) {
    if (isAuthError(error)) return actionFail("You must be signed in as an administrator.");
    throw error;
  }
}

function parseJsonValue(raw: string): { value: unknown } | { error: string } {
  const trimmed = raw.trim();
  if (trimmed === "") return { error: "Value is required." };
  try {
    return { value: JSON.parse(trimmed) as unknown };
  } catch {
    return { error: "Value must be valid JSON (e.g. \"text\", 42, true, {\"a\": 1})." };
  }
}

/** Creates or updates a site setting (key-validated, JSON-serializable). */
export async function setSettingAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const key = getString(formData, "key").trim();
  if (!key) return actionFail("Key is required.");

  const parsed = parseJsonValue(getString(formData, "value"));
  if ("error" in parsed) return actionFail(parsed.error);

  try {
    // Repository re-validates the key pattern and JSON-serializability.
    await setSetting(key, parsed.value);
    revalidatePath("/dashboard/settings");
    return actionOk();
  } catch (error) {
    return toActionState(error);
  }
}

/** Deletes a setting. Confirm-gated in the UI. */
export async function deleteSettingAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const key = getString(formData, "key").trim();
  if (key) {
    await deleteSetting(key);
  }
  revalidatePath("/dashboard/settings");
}

/**
 * Sets which department feeds the homepage featured section. The value is
 * validated against the fixed two-department contract — arbitrary strings,
 * empty values, and unknown departments are rejected before any write.
 * Upsert makes repeat saves idempotent (no duplicate rows).
 */
export async function setHomepageFeaturedDepartmentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const parsed = homepageFeaturedDepartmentSchema.safeParse(
    getString(formData, "department").trim().toLowerCase(),
  );
  if (!parsed.success) {
    return actionFail("Choose Furniture or Decoration.");
  }

  try {
    await setSetting(HOMEPAGE_FEATURED_DEPARTMENT_KEY, parsed.data);
    revalidatePath("/dashboard/settings");
    return actionOk();
  } catch (error) {
    return toActionState(error);
  }
}
