"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isAuthError } from "@/lib/server/auth/errors";
import { requireAdmin } from "@/lib/server/auth/authorization";
import {
  actionFail,
  actionOk,
  toActionState,
  type ActionState,
} from "@/lib/server/dashboard/action";
import { parseInput } from "@/lib/server/validate";
import {
  categoryCreateInputSchema,
  categoryUpdateInputSchema,
} from "@/lib/server/schemas/category.schema";
import {
  createCategory,
  updateCategory,
} from "@/lib/server/repositories/categories.repository";

const AUTH_FAIL: ActionState = actionFail("You must be signed in as an administrator.");

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function optionalNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

export async function createCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    if (isAuthError(error)) return AUTH_FAIL;
    throw error;
  }

  const order = optionalNumber(getString(formData, "order"));
  if (Number.isNaN(order)) return actionFail("Order must be a non-negative whole number.");

  try {
    const input = parseInput(categoryCreateInputSchema, {
      departmentId: getString(formData, "departmentId"),
      slug: getString(formData, "slug").trim(),
      name: getString(formData, "name"),
      tagline: getString(formData, "tagline") || null,
      description: getString(formData, "description") || null,
      imageId: getString(formData, "imageId") || null,
      order,
      isVisible: formData.get("isVisible") === "on",
    });
    const category = await createCategory(input);
    // Redirect outside try: redirect() throws NEXT_REDIRECT and must never be
    // swallowed by the error mapper below.
    const createdId = category.id;
    redirect(`/dashboard/categories/${createdId}`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    if (isAuthError(error)) return AUTH_FAIL;
    throw error;
  }

  const originalDepartmentId = getString(formData, "originalDepartmentId");
  const originalSlug = getString(formData, "originalSlug");
  if (!originalDepartmentId || !originalSlug) {
    return actionFail("Original category reference is missing.");
  }

  const order = optionalNumber(getString(formData, "order"));
  if (Number.isNaN(order)) return actionFail("Order must be a non-negative whole number.");

  try {
    await updateCategory(
      originalDepartmentId,
      originalSlug,
      parseInput(categoryUpdateInputSchema, {
        departmentId: getString(formData, "departmentId") || undefined,
        slug: getString(formData, "slug").trim() || undefined,
        name: getString(formData, "name") || undefined,
        tagline: getString(formData, "tagline") || null,
        description: getString(formData, "description") || null,
        imageId: getString(formData, "imageId") || null,
        order,
        isVisible: formData.get("isVisible") === "on",
      }),
    );
    revalidatePath("/dashboard/categories");
    return actionOk();
  } catch (error) {
    return toActionState(error);
  }
}
