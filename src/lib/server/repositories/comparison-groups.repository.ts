import "server-only";

import { prisma } from "@/lib/server/prisma";
import { toProductSummaryDTO } from "@/lib/server/dto/product.dto";
import type { ProductSummaryDTO } from "@/lib/server/dto/product.dto";
import { productSummarySelect } from "@/lib/server/selects";
import type { Prisma } from "@/generated/prisma/client";

export async function getComparisonGroupBySlug(slug: string): Promise<{
  id: string;
  slug: string;
  name: string;
  order: number;
} | null> {
  const group = await prisma.comparisonGroup.findUnique({ where: { slug } });
  return group;
}

export async function listComparisonGroups(): Promise<
  { id: string; slug: string; name: string; order: number }[]
> {
  return prisma.comparisonGroup.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
}

export async function listPublishedProductsByComparisonGroup(
  slug: string,
): Promise<ProductSummaryDTO[]> {
  const group = await prisma.comparisonGroup.findUnique({ where: { slug } });
  if (!group) return [];
  const products = (await prisma.product.findMany({
    where: { comparisonGroupId: group.id, status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }, { id: "asc" }],
    ...productSummarySelect,
  })) as unknown as Prisma.ProductGetPayload<{
    select: typeof productSummarySelect.select;
  }>[];
  return products.map(toProductSummaryDTO);
}