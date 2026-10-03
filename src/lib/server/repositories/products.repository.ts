import "server-only";

import { prisma } from "@/lib/server/prisma";
import { toProductDTO, toProductSummaryDTO } from "@/lib/server/dto/product.dto";
import type { ProductDTO } from "@/lib/server/dto/product.dto";
import type { ProductSummaryDTO } from "@/lib/server/dto/product.dto";
import { NotFoundError, toDataLayerError } from "@/lib/server/errors/data-layer-error";
import { buildPaginationArgs, paginated } from "@/lib/server/pagination";
import type { PaginatedResult } from "@/lib/server/pagination";
import { productDetailInclude, productSummarySelect } from "@/lib/server/selects";
import type {
  ProductCreateInput,
  ProductUpdateInput,
} from "@/lib/server/schemas/product.schema";
import type { ProductStatus, Availability } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productDetailInclude.include }>;
type SummaryRow = Prisma.ProductGetPayload<{ select: typeof productSummarySelect.select }>;

export interface ProductFilter {
  departmentSlug?: string;
  categorySlug?: string;
  comparisonGroupSlug?: string;
  status?: ProductStatus;
  availability?: Availability;
  search?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
  publishable?: boolean;
}

const SORT_OPTIONS: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
  "price-asc": [{ priceCents: "asc" }, { id: "asc" }],
  "price-desc": [{ priceCents: "desc" }, { id: "asc" }],
  "name-asc": [{ name: "asc" }, { id: "asc" }],
  "name-desc": [{ name: "desc" }, { id: "asc" }],
  featured: [{ isFeatured: "desc" }, { createdAt: "desc" }, { id: "asc" }],
  bestseller: [{ isBestseller: "desc" }, { createdAt: "desc" }, { id: "asc" }],
};

function buildWhere(filter: ProductFilter): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (filter.publishable) where.status = "PUBLISHED";
  else if (filter.status) where.status = filter.status;
  if (filter.departmentSlug) where.department = { slug: filter.departmentSlug };
  if (filter.categorySlug) {
    where.category = {
      slug: filter.categorySlug,
      ...(filter.departmentSlug ? { department: { slug: filter.departmentSlug } } : {}),
    };
  }
  if (filter.comparisonGroupSlug) where.comparisonGroup = { slug: filter.comparisonGroupSlug };
  if (filter.availability) where.availability = filter.availability;
  if (filter.isFeatured !== undefined) where.isFeatured = filter.isFeatured;
  if (filter.isBestseller !== undefined) where.isBestseller = filter.isBestseller;
  if (filter.isNewArrival !== undefined) where.isNewArrival = filter.isNewArrival;
  if (filter.minPriceCents !== undefined || filter.maxPriceCents !== undefined) {
    where.priceCents = {
      ...(filter.minPriceCents !== undefined ? { gte: filter.minPriceCents } : {}),
      ...(filter.maxPriceCents !== undefined ? { lte: filter.maxPriceCents } : {}),
    };
  }
  if (filter.search !== undefined && filter.search !== "") {
    const search = filter.search.trim();
    const terms = search.split(/\s+/).filter(Boolean);
    where.AND = terms.map((term) => ({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { slug: { contains: term, mode: "insensitive" } },
        { shortDescription: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { material: { contains: term, mode: "insensitive" } },
        { color: { contains: term, mode: "insensitive" } },
        { colorFamily: { contains: term, mode: "insensitive" } },
        { tags: { has: term } },
      ],
    }));
  }
  return where;
}

export async function getProductById(id: string): Promise<ProductDTO | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    ...productDetailInclude,
  });
  return product ? toProductDTO(product) : null;
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    ...productDetailInclude,
  });
  return product ? toProductDTO(product) : null;
}

export async function getPublishedProductBySlug(slug: string): Promise<ProductDTO | null> {
  const product = await prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" },
    ...productDetailInclude,
  });
  return product ? toProductDTO(product) : null;
}

export async function listProducts(filter: ProductFilter = {}): Promise<PaginatedResult<ProductDTO>> {
  const args = buildPaginationArgs(filter);
  const where = buildWhere(filter);
  const orderBy = SORT_OPTIONS[filter.sort ?? "newest"] ?? SORT_OPTIONS.newest;
  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy,
      skip: args.skip,
      take: args.take,
      ...productDetailInclude,
    }),
    prisma.product.count({ where }),
  ]);
  const rows = items as unknown as ProductRow[];
  return paginated(args, rows.map(toProductDTO), total);
}

export async function listPublishedProducts(
  filter: Omit<ProductFilter, "publishable" | "status"> = {},
): Promise<PaginatedResult<ProductDTO>> {
  return listProducts({ ...filter, publishable: true });
}

export async function countProducts(filter: Omit<ProductFilter, "publishable"> = {}): Promise<number> {
  return prisma.product.count({ where: buildWhere(filter) });
}

export async function createProduct(input: ProductCreateInput): Promise<ProductDTO> {
  const { images, ...data } = input;
  try {
    const product = await prisma.product.create({
      data: {
        ...data,
        images: images
          ? {
              create: images.map((image, index) => ({
                mediaAssetId: image.mediaAssetId,
                position: image.position ?? index,
                altText: image.altText,
              })),
            }
          : undefined,
      },
      ...productDetailInclude,
    });
    return toProductDTO(product as unknown as ProductRow);
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function updateProduct(id: string, input: ProductUpdateInput): Promise<ProductDTO> {
  const { images, ...data } = input;
  try {
    if (images) {
      await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId: id } }),
        prisma.product.update({
          where: { id },
          data: {
            ...data,
            images: {
              create: images.map((image, index) => ({
                mediaAssetId: image.mediaAssetId,
                position: image.position ?? index,
                altText: image.altText,
              })),
            },
          },
        }),
      ]);
    } else {
      await prisma.product.update({ where: { id }, data });
    }
    const product = await getProductById(id);
    if (!product) throw new NotFoundError(`Product "${id}" not found.`);
    return product;
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function archiveProduct(id: string): Promise<ProductDTO> {
  try {
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    const row = await prisma.product.findUnique({ where: { id }, ...productDetailInclude });
    if (!row) throw new NotFoundError(`Product "${id}" not found.`);
    return toProductDTO(row as unknown as ProductRow);
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function getProductAlternatives(productId: string): Promise<ProductSummaryDTO[]> {
  const alternatives = await prisma.productAlternative.findMany({
    where: { OR: [{ productId }, { alternativeProductId: productId }] },
    distinct: ["id"],
    include: {
      product: { select: { id: true } },
      alternativeProduct: { select: { ...productSummarySelect.select } },
    },
  });
  return alternatives
    .filter((row) => row.alternativeProduct.id !== productId)
    .map((row) => toProductSummaryDTO(row.alternativeProduct as unknown as SummaryRow));
}

export async function setProductAlternatives(
  productId: string,
  alternativeIds: string[],
): Promise<ProductSummaryDTO[]> {
  const idSet = new Set(alternativeIds);
  idSet.delete(productId);
  const ids = [...idSet];
  const existing = await prisma.product.count({ where: { id: { in: ids } } });
  if (existing !== ids.length) throw new NotFoundError("One or more alternative products do not exist.");
  await prisma.$transaction(async (tx) => {
    await tx.productAlternative.deleteMany({
      where: { OR: [{ productId }, { alternativeProductId: productId }] },
    });
    await tx.productAlternative.createMany({
      data: ids.flatMap((alternativeId) => [
        { productId, alternativeProductId: alternativeId },
        { productId: alternativeId, alternativeProductId: productId },
      ]),
    });
  });
  return getProductAlternatives(productId);
}