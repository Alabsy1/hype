import "server-only";

export const mediaAssetSelect = {
  select: {
    id: true,
    storageUrl: true,
    altText: true,
    mimeType: true,
    createdAt: true,
  },
} as const;

/**
 * Summary-shaped product projection used by list/search endpoints. The primary
 * image is resolved with a `position: 0` filter combined with `take: 1` so the
 * client still maps to a single image even a product holds duplicate positions.
 * The comparison group is intentionally excluded from summaries.
 */
export const productSummarySelect = {
  select: {
    id: true,
    slug: true,
    name: true,
    priceCents: true,
    compareAtPriceCents: true,
    shortDescription: true,
    material: true,
    materials: true,
    color: true,
    colorFamily: true,
    availability: true,
    tags: true,
    isFeatured: true,
    isBestseller: true,
    isNewArrival: true,
    department: { select: { name: true } },
    category: { select: { name: true, slug: true } },
    images: {
      where: { position: 0 },
      take: 1,
      orderBy: { position: "asc" as const },
      include: { mediaAsset: { select: mediaAssetSelect.select } },
    },
  },
} as const;

export const productDetailInclude = {
  include: {
    department: { select: { name: true } },
    category: { select: { name: true, slug: true } },
    comparisonGroup: { select: { name: true, slug: true } },
    images: {
      orderBy: { position: "asc" as const },
      include: { mediaAsset: { select: mediaAssetSelect.select } },
    },
  },
} as const;