import "server-only";

import { z } from "zod";

import type { Department } from "@/data/types";
import { getSetting } from "@/lib/server/repositories/settings.repository";

/**
 * Homepage featured-department control. Which department feeds the existing
 * homepage featured-products section. Stored as a JSON string in the
 * SiteSetting table — no schema change, no migration.
 */
export const HOMEPAGE_FEATURED_DEPARTMENT_KEY = "homepageFeaturedDepartment";

/** Safe default: the homepage has always shown Furniture. */
export const HOMEPAGE_FEATURED_DEPARTMENT_DEFAULT: Department = "furniture";

/**
 * Validation contract: exactly one of the two catalog departments. Anything
 * else (arbitrary strings, empty values, malformed shapes, unknown
 * departments) is rejected at the admin action boundary and treated as
 * misconfiguration (→ default) on read.
 */
export const homepageFeaturedDepartmentSchema = z.enum(["furniture", "decoration"]);

export type HomepageFeaturedDepartment = z.infer<typeof homepageFeaturedDepartmentSchema>;

/**
 * Reads the configured department. Missing setting → default. Invalid stored
 * value → default (safe configured fallback, never an arbitrary department).
 * Database errors propagate (DatabaseError) — a dead database must surface,
 * never silently masquerade as a configured default.
 */
export async function getHomepageFeaturedDepartment(): Promise<Department> {
  const setting = await getSetting(HOMEPAGE_FEATURED_DEPARTMENT_KEY);
  if (!setting) return HOMEPAGE_FEATURED_DEPARTMENT_DEFAULT;
  const parsed = homepageFeaturedDepartmentSchema.safeParse(setting.value);
  if (!parsed.success) return HOMEPAGE_FEATURED_DEPARTMENT_DEFAULT;
  return parsed.data;
}
