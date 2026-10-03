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
import { parseInput } from "@/lib/server/validate";
import { departmentUpdateInputSchema } from "@/lib/server/schemas/department.schema";
import { updateDepartment } from "@/lib/server/repositories/departments.repository";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * Updates a department (name / order / visibility). Hiding a department never
 * deletes products or categories — future public integration reads isVisible.
 */
export async function updateDepartmentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch (error) {
    if (isAuthError(error)) return actionFail("You must be signed in as an administrator.");
    throw error;
  }

  const id = getString(formData, "id");
  if (!id) return actionFail("Department id is missing.");

  const orderRaw = getString(formData, "order").trim();
  const order = orderRaw === "" ? undefined : Number(orderRaw);
  if (order !== undefined && (!Number.isInteger(order) || order < 0)) {
    return actionFail("Order must be a non-negative whole number.");
  }

  try {
    await updateDepartment(
      id,
      parseInput(departmentUpdateInputSchema, {
        name: getString(formData, "name") || undefined,
        order,
        isVisible: formData.get("isVisible") === "on",
      }),
    );
    revalidatePath("/dashboard/departments");
    return actionOk();
  } catch (error) {
    return toActionState(error);
  }
}
