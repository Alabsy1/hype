import { z } from "zod";

import { slugSchema } from "./catalog.schema";

export const categoryCreateInputSchema = z
  .object({
    departmentId: z.string().min(1),
    slug: slugSchema,
    name: z.string().trim().min(1).max(120),
    tagline: z.string().trim().max(200).optional().nullable(),
    description: z.string().trim().max(5_000).optional().nullable(),
    imageId: z.string().min(1).optional().nullable(),
    order: z.number().int().min(0).optional(),
    isVisible: z.boolean().optional(),
  })
  .strict();

export const categoryUpdateInputSchema = categoryCreateInputSchema.partial();

export type CategoryCreateInput = z.infer<typeof categoryCreateInputSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateInputSchema>;