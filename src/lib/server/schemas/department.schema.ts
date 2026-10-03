import { z } from "zod";

import { slugSchema } from "./catalog.schema";

export const departmentCreateInputSchema = z
  .object({
    slug: slugSchema,
    name: z.string().trim().min(1).max(120),
    isVisible: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  })
  .strict();

export const departmentUpdateInputSchema = departmentCreateInputSchema.partial();

export type DepartmentCreateInput = z.infer<typeof departmentCreateInputSchema>;
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateInputSchema>;