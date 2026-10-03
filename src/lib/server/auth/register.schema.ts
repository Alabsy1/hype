import { z } from "zod";

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "./constants";

// Pure Zod schema — no server-only import so it stays reusable. Consumed
// server-side by the register Server Action. Note there is deliberately NO
// role field: the server assigns CUSTOMER unconditionally.

export const registerInputSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(120),
    email: z
      .string()
      .trim()
      .min(3)
      .max(320)
      .pipe(z.email())
      .transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`)
      .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters long.`),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerInputSchema>;
