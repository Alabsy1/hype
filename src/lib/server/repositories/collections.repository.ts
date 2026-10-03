import "server-only";

import { prisma } from "@/lib/server/prisma";
import { toCollectionDTO } from "@/lib/server/dto/collection.dto";
import type { CollectionDTO } from "@/lib/server/dto/collection.dto";
import { toProductSummaryDTO } from "@/lib/server/dto/product.dto";
import type { ProductSummaryDTO } from "@/lib/server/dto/product.dto";
import { NotFoundError, toDataLayerError } from "@/lib/server/errors/data-layer-error";
import { productSummarySelect } from "@/lib/server/selects";
import type {
  CollectionCreateInput,
  CollectionUpdateInput,
} from "@/lib/server/schemas/collection.schema";

export async function getCollectionBySlug(slug: string): Promise<CollectionDTO | null> {
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: { _count: { select: { products: true } } },
  });
  return collection ? toCollectionDTO(collection) : null;
}

export async function listCollections(): Promise<CollectionDTO[]> {
  const collections = await prisma.collection.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return collections.map(toCollectionDTO);
}

export async function listVisibleCollections(): Promise<CollectionDTO[]> {
  const collections = await prisma.collection.findMany({
    where: { isVisible: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return collections.map(toCollectionDTO);
}

export async function getCollectionProducts(
  collectionId: string,
): Promise<ProductSummaryDTO[]> {
  const rows = await prisma.collectionProduct.findMany({
    where: { collectionId },
    orderBy: { position: "asc" },
    include: {
      product: {
        select: {
          ...productSummarySelect.select,
          status: true,
        },
      },
    },
  });
  return rows
    .filter((row) => row.product.status === "PUBLISHED")
    .map((row) => toProductSummaryDTO(row.product));
}

/**
 * Phase 07 addition: unfiltered membership in position order for the
 * dashboard collection editor (drafts/archived products must be manageable
 * too). No visibility or status filter — admin scope only.
 */
export async function getAllCollectionProducts(
  collectionId: string,
): Promise<ProductSummaryDTO[]> {
  const rows = await prisma.collectionProduct.findMany({
    where: { collectionId },
    orderBy: { position: "asc" },
    include: {
      product: {
        select: productSummarySelect.select,
      },
    },
  });
  return rows.map((row) => toProductSummaryDTO(row.product));
}

export async function createCollection(input: CollectionCreateInput): Promise<CollectionDTO> {
  try {
    const collection = await prisma.collection.create({ data: input });
    return toCollectionDTO(collection);
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function updateCollection(
  id: string,
  input: CollectionUpdateInput,
): Promise<CollectionDTO> {
  try {
    const collection = await prisma.collection.update({ where: { id }, data: input });
    return toCollectionDTO(collection);
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function addProductsToCollection(
  collectionId: string,
  productIds: string[],
): Promise<void> {
  try {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) throw new NotFoundError(`Collection "${collectionId}" not found.`);
    await prisma.$transaction(async (tx) => {
      const nextPositions = await tx.collectionProduct.aggregate({
        where: { collectionId },
        _max: { position: true },
      });
      let position = (nextPositions._max.position ?? -1) + 1;
      for (const productId of productIds) {
        await tx.collectionProduct.upsert({
          where: { collectionId_productId: { collectionId, productId } },
          update: {},
          create: { collectionId, productId, position: position++ },
        });
      }
    });
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function removeProductsFromCollection(
  collectionId: string,
  productIds: string[],
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.collectionProduct.deleteMany({ where: { collectionId, productId: { in: productIds } } });
      const remaining = await tx.collectionProduct.findMany({
        where: { collectionId },
        orderBy: { position: "asc" },
      });
      for (let index = 0; index < remaining.length; index += 1) {
        if (remaining[index].position !== index) {
          await tx.collectionProduct.update({
            where: { id: remaining[index].id },
            data: { position: index },
          });
        }
      }
    });
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function reorderCollectionProducts(
  collectionId: string,
  productIds: string[],
): Promise<void> {
  try {
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) throw new NotFoundError(`Collection "${collectionId}" not found.`);
    await prisma.$transaction(async (tx) => {
      for (let index = 0; index < productIds.length; index += 1) {
        await tx.collectionProduct.update({
          where: { collectionId_productId: { collectionId, productId: productIds[index] } },
          data: { position: index },
        });
      }
    });
  } catch (error) {
    throw toDataLayerError(error);
  }
}