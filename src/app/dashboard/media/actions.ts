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
  mediaAssetCreateInputSchema,
  mediaAssetUpdateInputSchema,
} from "@/lib/server/schemas/media.schema";
import { createMediaAsset, updateMediaAsset } from "@/lib/server/repositories/media.repository";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function optionalInt(value: string): number | null | undefined {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return Number.NaN;
  return parsed;
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

function parseDimensions(formData: FormData): { width?: number | null; height?: number | null } | ActionState {
  const width = optionalInt(getString(formData, "width"));
  const height = optionalInt(getString(formData, "height"));
  if (Number.isNaN(width) || Number.isNaN(height)) {
    return actionFail("Width and height must be positive whole numbers when provided.");
  }
  return { width, height };
}

/**
 * Registers a metadata-only media asset (existing storage URL/reference for
 * testing). Binary upload infrastructure is deferred — no files, no base64.
 */
export async function createMediaAssetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const dims = parseDimensions(formData);
  if ("ok" in dims) return dims;

  try {
    const input = parseInput(mediaAssetCreateInputSchema, {
      storageUrl: getString(formData, "storageUrl").trim(),
      mimeType: getString(formData, "mimeType").trim(),
      sizeBytes: getString(formData, "sizeBytes"),
      width: dims.width ?? null,
      height: dims.height ?? null,
      altText: getString(formData, "altText") || null,
    });
    const asset = await createMediaAsset(input);
    const createdId = asset.id;
    redirect(`/dashboard/media/${createdId}`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function updateMediaAssetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const id = getString(formData, "id");
  if (!id) return actionFail("Media id is missing.");

  const dims = parseDimensions(formData);
  if ("ok" in dims) return dims;

  try {
    await updateMediaAsset(
      id,
      parseInput(mediaAssetUpdateInputSchema, {
        storageUrl: getString(formData, "storageUrl").trim() || undefined,
        mimeType: getString(formData, "mimeType").trim() || undefined,
        sizeBytes: getString(formData, "sizeBytes").trim() === "" ? undefined : getString(formData, "sizeBytes"),
        width: dims.width,
        height: dims.height,
        altText: getString(formData, "altText") || null,
      }),
    );
    revalidatePath("/dashboard/media");
    return actionOk();
  } catch (error) {
    return toActionState(error);
  }
}
