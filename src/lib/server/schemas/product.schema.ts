import { z } from "zod";

import { availabilitySchema, slugSchema, statusSchema } from "./catalog.schema";

export const dimensionsSchema = z
  .object({
    width: z.number().finite(),
    height: z.number().finite(),
    depth: z.number().finite(),
    unit: z.enum(["cm", "in"]),
  })
  .strict();

export const productImageInputSchema = z
  .object({
    mediaAssetId: z.string().min(1),
    position: z.number().int().min(0).optional(),
    altText: z.string().trim().max(300).optional().nullable(),
  })
  .strict();

// Scalar fields shared by create and update. Array/flag defaults are applied
// only in the create schema so an update that omits e.g. `tags` never wipes it.
const productEditableFields = {
  slug: slugSchema,
  name: z.string().trim().min(1).max(160),
  priceCents: z.number().int().min(0),
  compareAtPriceCents: z.number().int().min(0).optional().nullable(),
  shortDescription: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1).max(20_000),
  departmentId: z.string().min(1),
  categoryId: z.string().min(1),
  comparisonGroupId: z.string().min(1),
  material: z.string().trim().min(1).max(200),
  materials: z.array(z.string().trim().min(1).max(200)),
  color: z.string().trim().min(1).max(200),
  colorFamily: z.string().trim().max(200).optional().nullable(),
  availability: availabilitySchema,
  dimensions: dimensionsSchema,
  features: z.array(z.string().trim().min(1).max(500)),
  tags: z.array(z.string().trim().min(1).max(100)),
  isFeatured: z.boolean(),
  isBestseller: z.boolean(),
  isNewArrival: z.boolean(),
  status: statusSchema.optional(),
  publishedAt: z.iso.datetime({ offset: true }).optional().nullable().transform((v) => (v ? new Date(v) : v)),
  images: z.array(productImageInputSchema).optional(),
} as const;

export const productCreateInputSchema = z
  .object({
    ...productEditableFields,
    materials: productEditableFields.materials.default([]),
    features: productEditableFields.features.default([]),
    tags: productEditableFields.tags.default([]),
    isFeatured: productEditableFields.isFeatured.default(false),
    isBestseller: productEditableFields.isBestseller.default(false),
    isNewArrival: productEditableFields.isNewArrival.default(false),
  })
  .strict();

export const productUpdateInputSchema = z.object(productEditableFields).strict().partial();

export type ProductCreateInput = z.infer<typeof productCreateInputSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateInputSchema>;