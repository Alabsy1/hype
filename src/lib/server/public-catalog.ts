// Public catalog composition layer (server-only). Composes Phase 05 public
// repository methods and adapts their DTOs to the static catalog shapes
// (`@/data/types`) that the presentation components consume — so pages and
// components render byte-identical UI from PostgreSQL instead of `src/data/*`.
//
// Visibility contract (enforced here, never in components):
//   Product.status = PUBLISHED
// + Department.isVisible = true
// + Category.isVisible = true (where a category scopes the read)
// Reads return null/[] when content is missing or hidden; pages map that to
// notFound(). No static fallback exists anywhere in this module.

import "server-only";

import type { Availability as StaticAvailability, Category as StaticCategory, Collection as StaticCollection, Department as StaticDepartment, Product as StaticProduct } from "@/data/types";
import type { ProductDTO } from "@/lib/server/dto/product.dto";
import { getVisibleDepartmentBySlug, listVisibleDepartments } from "@/lib/server/repositories/departments.repository";
import { getVisibleCategoryByDepartmentAndSlug, listVisibleCategoriesByDepartment } from "@/lib/server/repositories/categories.repository";
import { getPublishedProductBySlug, getProductAlternatives, getProductById, listPublishedProducts } from "@/lib/server/repositories/products.repository";
import { getCollectionProducts, listVisibleCollections } from "@/lib/server/repositories/collections.repository";
import { getMediaAssetById } from "@/lib/server/repositories/media.repository";

const DB_AVAILABILITY_TO_STATIC: Record<string, StaticAvailability> = {
  IN_STOCK: "in-stock",
  LOW_STOCK: "low-stock",
  MADE_TO_ORDER: "made-to-order",
};

const DEPARTMENT_PAGE_SIZE = 100;

export interface VisibleDepartment {
  id: string;
  slug: string;
  name: string;
}

/** Visible departments only — hidden departments are unreachable publicly. */
export async function getPublicDepartments(): Promise<VisibleDepartment[]> {
  const departments = await listVisibleDepartments();
  return departments.map((department) => ({
    id: department.id,
    slug: department.slug,
    name: department.name,
  }));
}

async function resolveDepartment(departmentSlug: string): Promise<VisibleDepartment | null> {
  const department = await getVisibleDepartmentBySlug(departmentSlug);
  if (!department) return null;
  return { id: department.id, slug: department.slug, name: department.name };
}

/** Visible department or null (hidden/missing departments are not public). */
export async function getPublicDepartment(departmentSlug: string): Promise<VisibleDepartment | null> {
  return resolveDepartment(departmentSlug);
}

function availabilityToStatic(value: string): StaticAvailability {
  return DB_AVAILABILITY_TO_STATIC[value] ?? "in-stock";
}

function dimensionsToStatic(dimensions: unknown): StaticProduct["dimensions"] {
  const record = (dimensions ?? {}) as Record<string, unknown>;
  const numeric = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);
  return {
    width: numeric(record.width),
    height: numeric(record.height),
    depth: numeric(record.depth),
    unit: record.unit === "in" ? "in" : "cm",
  };
}

/**
 * Adapts a full ProductDTO to the static Product shape. `departmentSlug` is
 * always passed explicitly by the caller (no guessing from names).
 * `alternatives` defaults to [] — list surfaces never render alternatives;
 * detail pages resolve real slugs (see getPublicProductDetail).
 */
export function toStaticProduct(
  dto: ProductDTO,
  departmentSlug: StaticDepartment,
  alternatives: string[] = [],
): StaticProduct {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.categorySlug,
    slug: dto.slug,
    price: dto.priceCents / 100,
    compareAtPrice: dto.compareAtPriceCents == null ? undefined : dto.compareAtPriceCents / 100,
    description: dto.description,
    shortDescription: dto.shortDescription,
    images: dto.images.map((image) => image.mediaAsset.storageUrl),
    dimensions: dimensionsToStatic(dto.dimensions),
    material: dto.material,
    color: dto.color,
    availability: availabilityToStatic(dto.availability),
    comparisonGroup: dto.comparisonGroupSlug,
    tags: dto.tags,
    features: dto.features,
    alternatives,
    featured: dto.isFeatured || undefined,
    bestseller: dto.isBestseller || undefined,
    newArrival: dto.isNewArrival || undefined,
    department: departmentSlug,
  };
}

export function toStaticCategory(
  category: {
    slug: string;
    name: string;
    tagline: string | null;
    description: string | null;
    order: number;
  },
  departmentSlug: StaticDepartment,
  imageUrl: string,
): StaticCategory {
  return {
    slug: category.slug,
    name: category.name,
    tagline: category.tagline ?? "",
    description: category.description ?? "",
    image: imageUrl,
    order: category.order,
    department: departmentSlug,
  };
}

async function categoryImageUrl(imageId: string | null): Promise<string> {
  if (!imageId) return "";
  const asset = await getMediaAssetById(imageId);
  return asset?.storageUrl ?? "";
}

/** Visible categories of a department with resolved image URLs (ordered). */
export async function getPublicCategories(departmentSlug: string): Promise<StaticCategory[]> {
  const department = await resolveDepartment(departmentSlug);
  if (!department) return [];
  const categories = await listVisibleCategoriesByDepartment(department.id);
  const staticDepartment = department.slug as StaticDepartment;
  return Promise.all(
    categories.map(async (category) =>
      toStaticCategory(category, staticDepartment, await categoryImageUrl(category.imageId)),
    ),
  );
}

/** Single visible category (department-scoped) with resolved image URL. */
export async function getPublicCategory(
  departmentSlug: string,
  categorySlug: string,
): Promise<StaticCategory | null> {
  const department = await resolveDepartment(departmentSlug);
  if (!department) return null;
  const category = await getVisibleCategoryByDepartmentAndSlug(department.id, categorySlug);
  if (!category) return null;
  return toStaticCategory(category, department.slug as StaticDepartment, await categoryImageUrl(category.imageId));
}

/** All published products of a visible department (static catalog order). */
export async function getPublicProducts(departmentSlug: string): Promise<StaticProduct[]> {
  const department = await resolveDepartment(departmentSlug);
  if (!department) return [];
  // "oldest" (createdAt ASC, id ASC) reproduces the static catalog order:
  // the seed inserts products sequentially in static order.
  const result = await listPublishedProducts({
    departmentSlug: department.slug,
    sort: "oldest",
    pageSize: DEPARTMENT_PAGE_SIZE,
  });
  const staticDepartment = department.slug as StaticDepartment;
  return result.items.map((dto) => toStaticProduct(dto, staticDepartment));
}

/** Published products of a visible department-scoped category. */
export async function getPublicProductsByCategory(
  departmentSlug: string,
  categorySlug: string,
): Promise<{ category: StaticCategory; products: StaticProduct[] } | null> {
  const category = await getPublicCategory(departmentSlug, categorySlug);
  if (!category) return null;
  const result = await listPublishedProducts({
    departmentSlug,
    categorySlug,
    sort: "oldest",
    pageSize: DEPARTMENT_PAGE_SIZE,
  });
  const staticDepartment = departmentSlug as StaticDepartment;
  return {
    category,
    products: result.items.map((dto) => toStaticProduct(dto, staticDepartment)),
  };
}

export interface PublicProductDetail {
  product: StaticProduct;
  categoryName: string;
  alternatives: StaticProduct[];
  related: StaticProduct[];
}

/**
 * Detail-page composition: published product in a visible department whose
 * category is visible, with resolved alternative slugs, related products, and
 * the display category name. Returns null when anything in the chain is
 * missing or hidden (pages map to notFound()).
 */
export async function getPublicProductDetail(
  departmentSlug: string,
  slug: string,
  relatedLimit = 6,
): Promise<PublicProductDetail | null> {
  const department = await resolveDepartment(departmentSlug);
  if (!department) return null;
  const dto = await getPublishedProductBySlug(slug);
  if (!dto || dto.departmentId !== department.id) return null;
  const category = await getVisibleCategoryByDepartmentAndSlug(department.id, dto.categorySlug);
  if (!category) return null;

  const staticDepartment = department.slug as StaticDepartment;
  const [siblings, alternativeSummaries, allDepartments] = await Promise.all([
    listPublishedProducts({ departmentSlug: department.slug, sort: "oldest", pageSize: DEPARTMENT_PAGE_SIZE }),
    getProductAlternatives(dto.id),
    getPublicDepartments(),
  ]);
  const departmentSlugById = new Map(allDepartments.map((entry) => [entry.id, entry.slug] as const));
  const toStatic = (item: ProductDTO): StaticProduct =>
    toStaticProduct(item, (departmentSlugById.get(item.departmentId) ?? department.slug) as StaticDepartment);

  const siblingDtos = siblings.items;
  const bySlug = new Map(siblingDtos.map((item) => [item.slug, item]));
  const alternativeDtos: ProductDTO[] = [];
  const misses: string[] = [];
  for (const summary of alternativeSummaries) {
    const match = bySlug.get(summary.slug);
    if (match) alternativeDtos.push(match);
    else misses.push(summary.slug);
  }
  // Cross-department alternatives (none in the seeded catalog) resolve
  // individually and pass the same visibility gates.
  if (misses.length > 0) {
    const resolved = await Promise.all(misses.map((miss) => getPublishedProductBySlug(miss)));
    for (const item of resolved) {
      if (!item) continue;
      const itemDepartment = await resolveDepartmentById(item.departmentId);
      if (!itemDepartment) continue;
      const itemCategory = await getVisibleCategoryByDepartmentAndSlug(item.departmentId, item.categorySlug);
      if (!itemCategory) continue;
      alternativeDtos.push(item);
    }
  }

  const product = toStaticProduct(dto, staticDepartment, alternativeDtos.map((item) => item.slug));

  // Same related algorithm as the static site: same comparison group first,
  // then other categories, capped at the limit.
  const sameGroup = siblingDtos.filter(
    (item) => item.comparisonGroupSlug === dto.comparisonGroupSlug && item.slug !== dto.slug,
  );
  const others = siblingDtos.filter(
    (item) => item.categorySlug !== dto.categorySlug && item.slug !== dto.slug,
  );
  const related = [...sameGroup, ...others].slice(0, relatedLimit).map(toStatic);

  return {
    product,
    categoryName: category.name,
    alternatives: alternativeDtos.map(toStatic),
    related,
  };
}

async function resolveDepartmentById(id: string): Promise<VisibleDepartment | null> {
  const departments = await getPublicDepartments();
  return departments.find((department) => department.id === id) ?? null;
}

export interface PublicCollection {
  collection: StaticCollection;
  products: StaticProduct[];
}

/** Visible collections with visibility-filtered member products (position order). */
export async function getPublicCollections(): Promise<PublicCollection[]> {
  const [collections, departments] = await Promise.all([
    listVisibleCollections(),
    getPublicDepartments(),
  ]);
  const departmentById = new Map(departments.map((department) => [department.id, department]));
  const visibleCategoryKeys = new Set<string>();
  await Promise.all(
    departments.map(async (department) => {
      const categories = await listVisibleCategoriesByDepartment(department.id);
      for (const category of categories) visibleCategoryKeys.add(`${department.id}::${category.slug}`);
    }),
  );
  const results: PublicCollection[] = [];
  for (const collection of collections) {
    const members = await getCollectionProducts(collection.id);
    const details = await Promise.all(members.map((member) => getProductById(member.id)));
    const products: StaticProduct[] = [];
    for (const detail of details) {
      if (!detail || detail.status !== "PUBLISHED") continue;
      const department = departmentById.get(detail.departmentId);
      if (!department) continue;
      if (!visibleCategoryKeys.has(`${detail.departmentId}::${detail.categorySlug}`)) continue;
      products.push(toStaticProduct(detail, department.slug as StaticDepartment));
    }
    results.push({
      collection: {
        slug: collection.slug,
        name: collection.name,
        eyebrow: collection.eyebrow,
        description: collection.description ?? "",
        products: products.map((product) => product.slug),
      },
      products,
    });
  }
  return results;
}

/** Single collection by slug with visibility-filtered members. */
export async function getPublicCollection(slug: string): Promise<PublicCollection | null> {
  const collections = await getPublicCollections();
  return collections.find((entry) => entry.collection.slug === slug) ?? null;
}

export interface PublicSearchIndex {
  products: StaticProduct[];
  categories: StaticCategory[];
}

/** Minimal search index for the header: published + visible catalog only. */
export async function getPublicSearchIndex(): Promise<PublicSearchIndex> {
  const departments = await getPublicDepartments();
  const products: StaticProduct[] = [];
  const categories: StaticCategory[] = [];
  for (const department of departments) {
    const staticDepartment = department.slug as StaticDepartment;
    const [items, cats] = await Promise.all([
      listPublishedProducts({ departmentSlug: department.slug, sort: "oldest", pageSize: DEPARTMENT_PAGE_SIZE }),
      listVisibleCategoriesByDepartment(department.id),
    ]);
    products.push(...items.items.map((dto) => toStaticProduct(dto, staticDepartment)));
    for (const category of cats) {
      categories.push(
        toStaticCategory(category, staticDepartment, await categoryImageUrl(category.imageId)),
      );
    }
  }
  return { products, categories };
}

/** Category display-name map keyed `${departmentSlug}:${categorySlug}` for cards. */
export async function getPublicCategoryNameMap(): Promise<Record<string, string>> {
  const departments = await getPublicDepartments();
  const map: Record<string, string> = {};
  await Promise.all(
    departments.map(async (department) => {
      const categories = await listVisibleCategoriesByDepartment(department.id);
      for (const category of categories) map[`${department.slug}:${category.slug}`] = category.name;
    }),
  );
  return map;
}
