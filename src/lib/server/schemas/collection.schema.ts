import { z } from "zod";

import { slugSchema } from "./catalog.schema";

export const collectionCreateInputSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1).max(160),
    eyebrow: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5_000).optional().nullable(),
    isVisible: z.boolean().optional(),
  })
  .strict();

export const collectionUpdateInputSchema = collectionCreateInputSchema.partial();

export const reorderCollectionProductsInputSchema = z
  .object({
    productIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

export type CollectionCreateInput = z.infer<typeof collectionCreateInputSchema>;
export type CollectionUpdateInput = z.infer<typeof collectionUpdateInputSchema>;