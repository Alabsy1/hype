import { z } from "zod";

// Pure Zod schema — no server-only import so it stays reusable. In Phase 06
// it is only consumed server-side (login Server Action); a future client form
// could reuse it for instant feedback without touching auth internals.

export const loginInputSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(3)
      .max(320)
      .pipe(z.email())
      .transform((value) => value.toLowerCase()),
    password: z.string().min(1, "Password is required.").max(128),
    returnTo: z.string().max(500).optional(),
  })
  .strict();

export type LoginInput = z.infer<typeof loginInputSchema>;
