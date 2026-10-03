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
  collectionCreateInputSchema,
  collectionUpdateInputSchema,
} from "@/lib/server/schemas/collection.schema";
import {
  addProductsToCollection,
  createCollection,
  getAllCollectionProducts,
  removeProductsFromCollection,
  reorderCollectionProducts,
  updateCollection,
} from "@/lib/server/repositories/collections.repository";

const AUTH_FAIL: ActionState = actionFail("You must be signed in as an administrator.");

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function ensureAdmin(): Promise<ActionState | null> {
  try {
    await requireAdmin();
    return null;
  } catch (error) {
    if (isAuthError(error)) return AUTH_FAIL;
    throw error;
  }
}

export async function createCollectionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  try {
    const input = parseInput(collectionCreateInputSchema, {
      slug: getString(formData, "slug").trim(),
      name: getString(formData, "name"),
      eyebrow: getString(formData, "eyebrow"),
      description: getString(formData, "description") || null,
      isVisible: formData.get("isVisible") === "on",
    });
    const collection = await createCollection(input);
    const createdId = collection.id;
    redirect(`/dashboard/collections/${createdId}`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateCollectionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const id = getString(formData, "id");
  if (!id) return actionFail("Collection id is missing.");

  try {
    await updateCollection(
      id,
      parseInput(collectionUpdateInputSchema, {
        slug: getString(formData, "slug").trim() || undefined,
        name: getString(formData, "name") || undefined,
        eyebrow: getString(formData, "eyebrow") || undefined,
        description: getString(formData, "description") || null,
        isVisible: formData.get("isVisible") === "on",
      }),
    );
    revalidatePath("/dashboard/collections");
    return actionOk();
  } catch (error) {
    return toActionState(error);
  }
}

/** Adds products (membership upsert — duplicates are safe no-ops). */
export async function addCollectionProductsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const collectionId = getString(formData, "collectionId");
  const productIds = formData
    .getAll("productId")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value !== "");
  if (collectionId && productIds.length > 0) {
    await addProductsToCollection(collectionId, productIds);
  }
  if (collectionId) revalidatePath(`/dashboard/collections/${collectionId}`);
}

/** Removes one membership (positions compacted transactionally). */
export async function removeCollectionProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const collectionId = getString(formData, "collectionId");
  const productId = getString(formData, "productId");
  if (collectionId && productId) {
    await removeProductsFromCollection(collectionId, [productId]);
    revalidatePath(`/dashboard/collections/${collectionId}`);
  }
}

/**
 * Moves one member up/down by swapping it with its neighbor, then rewrites
 * the FULL position array transactionally (partial rewrites would collide on
 * the unique [collectionId, position] constraint).
 */
export async function moveCollectionProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const collectionId = getString(formData, "collectionId");
  const productId = getString(formData, "productId");
  const direction = getString(formData, "direction") === "down" ? 1 : -1;
  if (!collectionId || !productId) return;

  const members = await getAllCollectionProducts(collectionId);
  const ids = members.map((member) => member.id);
  const index = ids.indexOf(productId);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= ids.length) return;

  [ids[index], ids[target]] = [ids[target], ids[index]];
  await reorderCollectionProducts(collectionId, ids);
  revalidatePath(`/dashboard/collections/${collectionId}`);
}
