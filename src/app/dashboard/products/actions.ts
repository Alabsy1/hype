"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isAuthError } from "@/lib/server/auth/errors";
import { getSafeRedirect, requireAdmin } from "@/lib/server/auth/authorization";
import { parsePriceToCents } from "@/lib/dashboard/pricing";
import {
  actionFail,
  actionOk,
  toActionState,
  type ActionState,
} from "@/lib/server/dashboard/action";
import { parseInput } from "@/lib/server/validate";
import {
  productCreateInputSchema,
  productUpdateInputSchema,
} from "@/lib/server/schemas/product.schema";
import {
  archiveProduct,
  createProduct,
  getProductById,
  setProductAlternatives,
  updateProduct,
} from "@/lib/server/repositories/products.repository";

const AUTH_FAIL: ActionState = actionFail("You must be signed in as an administrator.");

async function ensureAdmin(): Promise<ActionState | null> {
  try {
    await requireAdmin();
    return null;
  } catch (error) {
    if (isAuthError(error)) return AUTH_FAIL;
    throw error;
  }
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getStringList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value !== "");
}

/** Splits comma- and/or newline-separated admin input into clean values. */
function splitList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

interface ParsedProductFields {
  data: Record<string, unknown>;
}

/**
 * Parses and pre-validates the product form into the repository input shape.
 * Price/dimension rules live here (human messages); the Zod schema then
 * enforces types, lengths, and relations server-side as the security boundary.
 */
function parseProductFields(formData: FormData): ParsedProductFields | ActionState {
  const price = parsePriceToCents(getString(formData, "price"));
  if (!price.ok) return actionFail(price.error ?? "Price is invalid.");

  const compareRaw = getString(formData, "compareAtPrice");
  let compareAtPriceCents: number | null = null;
  if (compareRaw !== "") {
    const compare = parsePriceToCents(compareRaw);
    if (!compare.ok) return actionFail(compare.error ?? "Compare-at price is invalid.");
    compareAtPriceCents = compare.cents;
  }

  const width = Number(getString(formData, "dimWidth"));
  const height = Number(getString(formData, "dimHeight"));
  const depth = Number(getString(formData, "dimDepth"));
  const unit = getString(formData, "dimUnit") === "in" ? "in" : "cm";
  if (![width, height, depth].every((v) => Number.isFinite(v) && v > 0)) {
    return actionFail("Dimensions must be positive numbers.");
  }

  // Image rows stay index-aligned with their hidden inputs (no filtering
  // before pairing — empty alt text is valid and becomes null).
  const assetIds = formData
    .getAll("imageAssetId")
    .filter((value): value is string => typeof value === "string");
  const altTexts = formData
    .getAll("imageAlt")
    .filter((value): value is string => typeof value === "string");
  const images = assetIds
    .map((mediaAssetId, index) => {
      const alt = (altTexts[index] ?? "").trim();
      return { mediaAssetId: mediaAssetId.trim(), altText: alt === "" ? null : alt };
    })
    .filter((image) => image.mediaAssetId !== "");

  return {
    data: {
      slug: getString(formData, "slug").trim(),
      name: getString(formData, "name"),
      priceCents: price.cents,
      compareAtPriceCents,
      shortDescription: getString(formData, "shortDescription"),
      description: getString(formData, "description"),
      departmentId: getString(formData, "departmentId"),
      categoryId: getString(formData, "categoryId"),
      comparisonGroupId: getString(formData, "comparisonGroupId"),
      material: getString(formData, "material"),
      materials: splitList(getString(formData, "materials")),
      color: getString(formData, "color"),
      colorFamily: getString(formData, "colorFamily") || null,
      availability: getString(formData, "availability"),
      dimensions: { width, height, depth, unit },
      features: splitList(getString(formData, "features")),
      tags: splitList(getString(formData, "tags")),
      isFeatured: formData.get("isFeatured") === "on",
      isBestseller: formData.get("isBestseller") === "on",
      isNewArrival: formData.get("isNewArrival") === "on",
      status: getString(formData, "status"),
      images,
    },
  };
}

function isActionState(value: ParsedProductFields | ActionState): value is ActionState {
  return (value as ActionState).error !== undefined || (value as ActionState).ok !== undefined;
}

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const parsed = parseProductFields(formData);
  if (isActionState(parsed)) return parsed;

  try {
    const input = parseInput(productCreateInputSchema, {
      ...parsed.data,
      // New products publish immediately only when the admin explicitly
      // chooses PUBLISHED; the form defaults to DRAFT.
      publishedAt: parsed.data.status === "PUBLISHED" ? new Date().toISOString() : undefined,
    });
    const product = await createProduct(input);
    // Redirect outside try: redirect() throws NEXT_REDIRECT and must never be
    // swallowed by the error mapper below.
    const createdId = product.id;
    redirect(`/dashboard/products/${createdId}`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateProductAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const id = getString(formData, "id");
  if (!id) return actionFail("Product id is missing.");

  const parsed = parseProductFields(formData);
  if (isActionState(parsed)) return parsed;

  try {
    const existing = await getProductById(id);
    if (!existing) return actionFail("The requested product was not found.");
    // publishedAt is history: set once on first publish, never cleared or
    // overwritten (archiving and re-publishing retain the original timestamp).
    const publishedAt =
      existing.publishedAt ??
      (parsed.data.status === "PUBLISHED" ? new Date().toISOString() : undefined);
    await updateProduct(
      id,
      parseInput(productUpdateInputSchema, { ...parsed.data, publishedAt }),
    );
    revalidatePath("/dashboard/products");
    return actionOk();
  } catch (error) {
    return toActionState(error);
  }
}

/** Explicit archive (no hard delete). Confirmed in the UI before submission. */
export async function archiveProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = getString(formData, "id");
  if (id) {
    await archiveProduct(id);
  }
  const returnTo = getString(formData, "returnTo");
  if (returnTo !== "") {
    // Full redirect validation (rejects absolute, protocol-relative, and
    // backslash-external targets); invalid values fall back to the list.
    redirect(getSafeRedirect(returnTo, "/dashboard/products"));
  }
  revalidatePath("/dashboard/products");
}

export async function setAlternativesAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const productId = getString(formData, "productId");
  if (!productId) return actionFail("Product id is missing.");
  const alternativeIds = getStringList(formData, "alternativeId");

  try {
    // Repository enforces symmetry transactionally, drops self-references,
    // dedupes, and rejects unknown ids.
    await setProductAlternatives(productId, alternativeIds);
    revalidatePath(`/dashboard/products/${productId}`);
    return actionOk();
  } catch (error) {
    return toActionState(error);
  }
}
