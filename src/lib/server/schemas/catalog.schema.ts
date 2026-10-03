import { z } from "zod";

// Pure Zod schemas — deliberately NOT server-only so future client-side forms
// can reuse them for input validation. They contain no Prisma/database code.

export const PRODUCT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const AVAILABILITIES = [
  "IN_STOCK",
  "LOW_STOCK",
  "MADE_TO_ORDER",
] as const;

export const PRODUCT_SORTS = [
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "name-asc",
  "name-desc",
  "featured",
  "bestseller",
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE = 1;

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Slug may only use letters, numbers and hyphens.");

export const statusSchema = z.enum(PRODUCT_STATUSES);
export const availabilitySchema = z.enum(AVAILABILITIES);
export const productSortSchema = z.enum(PRODUCT_SORTS);

// Accepts booleans as well as the "true"/"false" strings a URL query string
// would produce. Coercion is explicit: "false" must NOT become true.
const optionalBoolean = z
  .union([z.literal("true"), z.literal("false"), z.boolean()])
  .transform((value) => value === true || value === "true");

export const paginationSchema = z
  .object({
    page: z.coerce.number().int().min(MIN_PAGE).default(1),
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  })
  .strict();

export const productListQuerySchema = paginationSchema
  .extend({
    department: slugSchema.optional(),
    category: slugSchema.optional(),
    comparisonGroup: slugSchema.optional(),
    status: statusSchema.optional(),
    availability: availabilitySchema.optional(),
    search: z.string().trim().max(120).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    isFeatured: optionalBoolean.optional(),
    isBestseller: optionalBoolean.optional(),
    isNewArrival: optionalBoolean.optional(),
    sort: productSortSchema.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.minPrice != null && data.maxPrice != null && data.minPrice > data.maxPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minPrice"],
        message: "minPrice cannot be greater than maxPrice.",
      });
    }
  });

export type ProductListQuery = z.infer<typeof productListQuerySchema>;