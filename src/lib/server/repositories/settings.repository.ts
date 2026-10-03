import "server-only";

import { prisma } from "@/lib/server/prisma";
import { toDataLayerError, ValidationError } from "@/lib/server/errors/data-layer-error";
import type { Prisma } from "@/generated/prisma/client";

const SETTING_KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/;

export interface SiteSettingValue {
  key: string;
  value: unknown;
  updatedAt: Date;
}

export async function getSetting(key: string): Promise<SiteSettingValue | null> {
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return setting ? { key: setting.key, value: setting.value, updatedAt: setting.updatedAt } : null;
}

export async function getSettingValue<T>(key: string): Promise<T | null> {
  const setting = await getSetting(key);
  return setting ? (setting.value as T) : null;
}

export async function getSettings(keys: string[]): Promise<SiteSettingValue[]> {
  if (keys.length === 0) return [];
  const settings = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
  return settings.map((setting) => ({
    key: setting.key,
    value: setting.value,
    updatedAt: setting.updatedAt,
  }));
}

export async function setSetting(key: string, value: unknown): Promise<SiteSettingValue> {
  if (!SETTING_KEY_PATTERN.test(key)) {
    throw new ValidationError(`Invalid setting key "${key}".`);
  }
  const isJsonSerializable = (input: unknown): boolean => {
    if (input === null || typeof input === "string" || typeof input === "boolean") return true;
    if (typeof input === "number") return Number.isFinite(input);
    if (Array.isArray(input)) return input.every(isJsonSerializable);
    if (typeof input === "object") {
      return Object.entries(input as Record<string, unknown>).every(
        ([k, v]) => SETTING_KEY_PATTERN.test(k) && isJsonSerializable(v),
      );
    }
    return false;
  };
  if (!isJsonSerializable(value)) {
    throw new ValidationError(`Setting "${key}" must be JSON-serializable.`);
  }
  try {
    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue },
      create: { key, value: value as Prisma.InputJsonValue },
    });
    return { key: setting.key, value: setting.value, updatedAt: setting.updatedAt };
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function deleteSetting(key: string): Promise<boolean> {
  try {
    await prisma.siteSetting.delete({ where: { key } });
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2025"
    ) {
      return false;
    }
    throw toDataLayerError(error);
  }
}

/**
 * Phase 07 addition: full key listing (ordered) for the dashboard settings
 * manager. Admin scope only.
 */
export async function listSettings(): Promise<SiteSettingValue[]> {
  const settings = await prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  return settings.map((setting) => ({
    key: setting.key,
    value: setting.value,
    updatedAt: setting.updatedAt,
  }));
}