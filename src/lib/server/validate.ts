import "server-only";

import { z } from "zod";

import { ValidationError } from "@/lib/server/errors/data-layer-error";

/**
 * Parses and validates application input with a Zod schema and converts a
 * validation failure into a typed ValidationError. Returns the parsed, typed
 * value on success.
 */
export function parseInput<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("The provided input is invalid.", { details: result.error.issues });
  }
  return result.data;
}