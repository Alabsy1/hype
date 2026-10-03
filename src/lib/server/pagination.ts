import "server-only";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE } from "@/lib/server/schemas/catalog.schema";

export interface PaginationArgs {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> extends PaginationMeta {
  items: T[];
}

/**
 * Builds Prisma skip/take from a validated page/pageSize. Values are clamped
 * as a safety net (Zod already enforces limits at the schema boundary).
 */
export function buildPaginationArgs(input: {
  page?: number;
  pageSize?: number;
}): PaginationArgs {
  const page = Math.max(MIN_PAGE, Math.trunc(input.page ?? 1));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(input.pageSize ?? DEFAULT_PAGE_SIZE)));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function toPaginationMeta(args: PaginationArgs, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / args.pageSize));
  return {
    page: args.page,
    pageSize: args.pageSize,
    total,
    totalPages,
    hasNextPage: args.page * args.pageSize < total,
    hasPreviousPage: args.page > 1,
  };
}

export function paginated<T>(args: PaginationArgs, items: T[], total: number): PaginatedResult<T> {
  return { items, ...toPaginationMeta(args, total) };
}