import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { productDetailInclude, productSummarySelect } from "@/lib/server/selects";

export interface MediaAssetDTO {
  id: string;
  storageUrl: string;
  altText: string | null;
  mimeType: string;
  createdAt: string;
}

export interface ProductImageDTO {
  id: string;
  position: number;
  altText: string | null;
  mediaAsset: MediaAssetDTO;
}

export interface DimensionDTO {
  width: number;
  height: number;
  depth: number;
  unit: "cm" | "in";
}

/**
 * Public product shape. Dimensions are intentionally left as untyped JSON —
 * callers validated against the Zod input schema may cast it safely, but the
 * data layer never trusts raw stored JSON.
 */
export interface ProductSummaryDTO {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  shortDescription: string;
  material: string;
  materials: string[];
  color: string;
  colorFamily: string | null;
  availability: "IN_STOCK" | "LOW_STOCK" | "MADE_TO_ORDER";
  tags: string[];
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  primaryImage: ProductImageDTO | null;
  departmentName: string;
  categoryName: string;
  categorySlug: string;
}

export interface ProductDTO extends ProductSummaryDTO {
  description: string;
  dimensions: unknown;
  features: string[];
  departmentId: string;
  categoryId: string;
  comparisonGroupId: string;
  comparisonGroupName: string;
  comparisonGroupSlug: string;
  images: ProductImageDTO[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productDetailInclude.include;
}>;

type ProductSummaryFromClient = Prisma.ProductGetPayload<{
  select: typeof productSummarySelect.select;
}>;

export function toProductImageDTO(image: ProductWithRelations["images"][number]): ProductImageDTO {
  return {
    id: image.id,
    position: image.position,
    altText: image.altText,
    mediaAsset: {
      id: image.mediaAsset.id,
      storageUrl: image.mediaAsset.storageUrl,
      altText: image.mediaAsset.altText,
      mimeType: image.mediaAsset.mimeType,
      createdAt: image.mediaAsset.createdAt.toISOString(),
    },
  };
}

export function toProductSummaryDTO(product: ProductSummaryFromClient): ProductSummaryDTO {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    shortDescription: product.shortDescription,
    material: product.material,
    materials: product.materials,
    color: product.color,
    colorFamily: product.colorFamily,
    availability: product.availability,
    tags: product.tags,
    isFeatured: product.isFeatured,
    isBestseller: product.isBestseller,
    isNewArrival: product.isNewArrival,
    primaryImage: product.images[0] ? toProductImageDTO(product.images[0]) : null,
    departmentName: product.department.name,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
  };
}

export function toProductDTO(product: ProductWithRelations): ProductDTO {
  const primary = product.images.length > 0 ? product.images[0] : null;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    shortDescription: product.shortDescription,
    description: product.description,
    material: product.material,
    materials: product.materials,
    color: product.color,
    colorFamily: product.colorFamily,
    availability: product.availability,
    dimensions: product.dimensions,
    features: product.features,
    tags: product.tags,
    isFeatured: product.isFeatured,
    isBestseller: product.isBestseller,
    isNewArrival: product.isNewArrival,
    images: product.images.map(toProductImageDTO),
    primaryImage: primary ? toProductImageDTO(primary) : null,
    departmentId: product.departmentId,
    departmentName: product.department.name,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    comparisonGroupId: product.comparisonGroupId,
    comparisonGroupName: product.comparisonGroup.name,
    comparisonGroupSlug: product.comparisonGroup.slug,
    status: product.status,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    publishedAt: product.publishedAt ? product.publishedAt.toISOString() : null,
  };
}