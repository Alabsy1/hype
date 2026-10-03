import { z } from "zod";

// Metadata-only schema (storageUrl may be a local /images path or an absolute
// URL — never binary data, never base64). No server-only import: reusable by
// future client forms; Phase 07 consumes it server-side only.

export const mediaAssetCreateInputSchema = z
  .object({
    storageUrl: z.string().trim().min(1).max(2_000),
    mimeType: z.string().trim().min(1).max(100),
    sizeBytes: z.coerce.number().int().min(0),
    width: z.coerce.number().int().min(1).optional().nullable(),
    height: z.coerce.number().int().min(1).optional().nullable(),
    altText: z.string().trim().max(300).optional().nullable(),
  })
  .strict();

export const mediaAssetUpdateInputSchema = mediaAssetCreateInputSchema.partial();

export type MediaAssetCreateInput = z.infer<typeof mediaAssetCreateInputSchema>;
export type MediaAssetUpdateInput = z.infer<typeof mediaAssetUpdateInputSchema>;
