import "server-only";

import { prisma } from "@/lib/server/prisma";
import { toCategoryDTO } from "@/lib/server/dto/category.dto";
import type { CategoryDTO } from "@/lib/server/dto/category.dto";
import { NotFoundError, toDataLayerError } from "@/lib/server/errors/data-layer-error";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
} from "@/lib/server/schemas/category.schema";

export async function getCategoryByDepartmentAndSlug(
  departmentId: string,
  slug: string,
): Promise<CategoryDTO | null> {
  const category = await prisma.category.findUnique({
    where: { departmentId_slug: { departmentId, slug } },
    include: {
      _count: { select: { products: { where: { status: "PUBLISHED" } } } },
    },
  });
  return category ? toCategoryDTO(category) : null;
}

export async function getVisibleCategoryByDepartmentAndSlug(
  departmentId: string,
  slug: string,
): Promise<CategoryDTO | null> {
  const category = await prisma.category.findFirst({
    where: { departmentId, slug, isVisible: true },
    include: {
      _count: { select: { products: { where: { status: "PUBLISHED" } } } },
    },
  });
  return category ? toCategoryDTO(category) : null;
}

export async function listCategories(): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: { where: { status: "PUBLISHED" } } } },
    },
  });
  return categories.map(toCategoryDTO);
}

export async function listVisibleCategories(): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: { where: { status: "PUBLISHED" } } } },
    },
  });
  return categories.map(toCategoryDTO);
}

export async function listCategoriesByDepartment(departmentId: string): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    where: { departmentId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: { where: { status: "PUBLISHED" } } } },
    },
  });
  return categories.map(toCategoryDTO);
}

export async function listVisibleCategoriesByDepartment(
  departmentId: string,
): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    where: { departmentId, isVisible: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: { where: { status: "PUBLISHED" } } } },
    },
  });
  return categories.map(toCategoryDTO);
}

export async function createCategory(input: CategoryCreateInput): Promise<CategoryDTO> {
  try {
    await prisma.category.create({ data: input });
  } catch (error) {
    throw toDataLayerError(error);
  }
  const created = await getCategoryByDepartmentAndSlug(input.departmentId, input.slug);
  if (!created) throw new NotFoundError(`Category "${input.departmentId}/${input.slug}" not found.`);
  return created;
}

export async function updateCategory(
  departmentId: string,
  slug: string,
  input: CategoryUpdateInput,
): Promise<CategoryDTO> {
  const found = await prisma.category.findUnique({
    where: { departmentId_slug: { departmentId, slug } },
  });
  if (!found) throw new NotFoundError(`Category "${departmentId}/${slug}" not found.`);
  try {
    const updated = await prisma.category.update({ where: { id: found.id }, data: input });
    return toCategoryDTO(updated);
  } catch (error) {
    throw toDataLayerError(error);
  }
}

/**
 * Phase 07 addition: lookup by primary key for the dashboard edit route.
 * Admin-scoped (no visibility filter); counts published products like the
 * other admin reads.
 */
export async function getCategoryById(id: string): Promise<CategoryDTO | null> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: { where: { status: "PUBLISHED" } } } },
    },
  });
  return category ? toCategoryDTO(category) : null;
}