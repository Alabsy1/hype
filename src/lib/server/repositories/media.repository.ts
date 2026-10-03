import "server-only";

import { prisma } from "@/lib/server/prisma";
import { buildPaginationArgs, paginated } from "@/lib/server/pagination";
import type { PaginatedResult } from "@/lib/server/pagination";
import { toDataLayerError } from "@/lib/server/errors/data-layer-error";
import type {
  MediaAssetCreateInput,
  MediaAssetUpdateInput,
} from "@/lib/server/schemas/media.schema";

export interface MediaAssetRow {
  id: string;
  storageUrl: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  createdAt: Date;
}

export async function getMediaAssetById(id: string): Promise<MediaAssetRow | null> {
  return prisma.mediaAsset.findUnique({ where: { id } });
}

export async function listProductImages(productId: string): Promise<MediaAssetRow[]> {
  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" },
    select: {
      mediaAsset: true,
    },
  });
  return images.map((row) => row.mediaAsset);
}

export async function getPrimaryProductImage(
  productId: string,
): Promise<MediaAssetRow | null> {
  const image = await prisma.productImage.findFirst({
    where: { productId, position: 0 },
    select: { mediaAsset: true },
  });
  return image?.mediaAsset ?? null;
}

export interface MediaAssetFilter {
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Phase 07 addition: paginated asset listing for the dashboard media manager.
 * Search matches storage URL, alt text, and MIME type (case-insensitive).
 */
export async function listMediaAssets(
  filter: MediaAssetFilter = {},
): Promise<PaginatedResult<MediaAssetRow>> {
  const args = buildPaginationArgs(filter);
  const term = filter.search?.trim();
  const where =
    term && term !== ""
      ? {
          OR: [
            { storageUrl: { contains: term, mode: "insensitive" as const } },
            { altText: { contains: term, mode: "insensitive" as const } },
            { mimeType: { contains: term, mode: "insensitive" as const } },
          ],
        }
      : undefined;
  const [items, total] = await prisma.$transaction([
    prisma.mediaAsset.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: args.skip,
      take: args.take,
    }),
    prisma.mediaAsset.count({ where }),
  ]);
  return paginated(args, items, total);
}

/**
 * Phase 07 addition: metadata-only asset registration (an existing storage
 * URL/reference for testing). Never stores binary data.
 */
export async function createMediaAsset(input: MediaAssetCreateInput): Promise<MediaAssetRow> {
  try {
    return await prisma.mediaAsset.create({ data: input });
  } catch (error) {
    throw toDataLayerError(error);
  }
}

/** Phase 07 addition: metadata update. No delete (FK references may exist). */
export async function updateMediaAsset(
  id: string,
  input: MediaAssetUpdateInput,
): Promise<MediaAssetRow> {
  try {
    return await prisma.mediaAsset.update({ where: { id }, data: input });
  } catch (error) {
    throw toDataLayerError(error);
  }
}