/**
 * PHASE 08 — Catalog migration: static Hype catalog → PostgreSQL.
 *
 * Source of truth: `src/data/*` (48 products: 24 furniture + 24 decoration).
 * The public website is NOT touched by this script; it keeps reading static
 * data until Phase 09. No HTTP surface — run explicitly via `npm run db:seed`.
 *
 * Modes:
 *   npm run db:seed            validate + migrate + report (needs DATABASE_URL)
 *   npm run db:seed -- --dry-run   validate + inventory only (no DB, no writes)
 *   npm run db:seed -- --verify    DB-vs-static equality check (needs DATABASE_URL)
 *
 * Why this file talks to Prisma directly instead of Phase 05 repositories:
 * server modules carry `import "server-only"`, which cannot load inside a CLI
 * process. The seed therefore reuses the same *contracts* — the pure Zod input
 * schemas, integer-cents pricing, slug rules, symmetric alternatives, ordered
 * membership — and documents every deliberate mapping decision below and in
 * `docs/CATALOG_MIGRATION.md`.
 *
 * Ownership model (idempotent re-runs):
 * - Static source owns CONTENT + RELATIONSHIPS of migrated rows. Re-running
 *   refreshes those fields from `src/data/*` (images/alternatives/memberships
 *   are re-synced as sets; never merged).
 * - Admin owns PUBLISHING LIFECYCLE. Re-runs never touch `status`,
 *   `publishedAt`, or `isVisible` on rows that already exist.
 * - MediaAsset rows are content-addressed by `storageUrl`: existing rows are
 *   left untouched.
 */

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { products as furnitureProducts } from "@/data/products";
import { decorationProducts } from "@/data/decorationProducts";
import { categories as furnitureCategories } from "@/data/categories";
import { decorationCategories } from "@/data/decorationCategories";
import { collections as staticCollections } from "@/data/collections";
import type { Category as StaticCategory, Collection as StaticCollection, Product as StaticProduct } from "@/data/types";
import { productCreateInputSchema } from "@/lib/server/schemas/product.schema";
import { categoryCreateInputSchema } from "@/lib/server/schemas/category.schema";
import { departmentCreateInputSchema } from "@/lib/server/schemas/department.schema";
import { collectionCreateInputSchema } from "@/lib/server/schemas/collection.schema";
import { mediaAssetCreateInputSchema } from "@/lib/server/schemas/media.schema";

// Local env files are git-ignored; tolerate their absence (dry-run needs no
// database). Order mirrors Next.js precedence: `.env.local` overrides `.env`
// (real process environment always wins; loadEnvFile never overrides it).
for (const file of [".env", ".env.local"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // DB modes fail below with a clear message when no URL is configured.
  }
}

// ---------------------------------------------------------------------------
// Mapping decisions (each documented; no silent invention)
// ---------------------------------------------------------------------------

const AVAILABILITY_MAP = {
  "in-stock": "IN_STOCK",
  "low-stock": "LOW_STOCK",
  "made-to-order": "MADE_TO_ORDER",
} as const;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

/** Mechanical Title Case for records that carry no display name in static. */
function startCase(slug: string): string {
  return slug
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function mimeFromExtension(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "avif") return "image/avif";
  if (ext === "svg") return "image/svg+xml";
  return "application/octet-stream";
}

/** Integer-cents conversion (static prices are whole units; validated). */
function toCents(value: number): number {
  return value * 100;
}

function departmentOf(product: StaticProduct, file: "furniture" | "decoration"): string {
  return product.department ?? file;
}

// ---------------------------------------------------------------------------
// Inventory (pure; also powers --dry-run and --verify)
// ---------------------------------------------------------------------------

interface ProductEntry {
  source: StaticProduct;
  departmentSlug: string;
}

interface Inventory {
  departments: { slug: string; name: string; order: number }[];
  categories: { departmentSlug: string; source: StaticCategory }[];
  comparisonGroups: { slug: string; name: string; order: number }[];
  products: ProductEntry[];
  mediaUrls: string[];
  alternativeEdges: { from: string; to: string }[];
  collections: StaticCollection[];
}

function buildInventory(): Inventory {
  const departments = [
    { slug: "furniture", name: "Furniture", order: 0 },
    { slug: "decoration", name: "Decoration", order: 1 },
  ];

  const categories = [
    ...furnitureCategories.map((source) => ({ departmentSlug: "furniture", source })),
    ...decorationCategories.map((source) => ({
      departmentSlug: source.department ?? "decoration",
      source,
    })),
  ];

  const products: ProductEntry[] = [
    ...furnitureProducts.map((source) => ({
      source,
      departmentSlug: departmentOf(source, "furniture"),
    })),
    ...decorationProducts.map((source) => ({
      source,
      departmentSlug: departmentOf(source, "decoration"),
    })),
  ];

  const groupSlugs = [...new Set(products.map((entry) => entry.source.comparisonGroup))].sort();
  const comparisonGroups = groupSlugs.map((slug, index) => ({
    slug,
    name: startCase(slug),
    order: index,
  }));

  const mediaUrls = [
    ...new Set([
      ...products.flatMap((entry) => entry.source.images),
      ...categories.map((entry) => entry.source.image),
    ]),
  ];

  const alternativeEdges = products.flatMap((entry) =>
    entry.source.alternatives.map((to) => ({ from: entry.source.slug, to })),
  );

  return {
    departments,
    categories,
    comparisonGroups,
    products,
    mediaUrls,
    alternativeEdges,
    collections: staticCollections,
  };
}

interface ValidationResult {
  fatal: string[];
  warnings: string[];
}

/** Fails BEFORE any write when the source cannot be represented exactly. */
function validateInventory(inventory: Inventory): ValidationResult {
  const fatal: string[] = [];
  const warnings: string[] = [];

  if (inventory.products.length !== 48) {
    fatal.push(`Expected 48 products, found ${inventory.products.length}.`);
  }
  const furnCount = inventory.products.filter((e) => e.departmentSlug === "furniture").length;
  const decoCount = inventory.products.filter((e) => e.departmentSlug === "decoration").length;
  if (furnCount !== 24) fatal.push(`Expected 24 furniture products, found ${furnCount}.`);
  if (decoCount !== 24) fatal.push(`Expected 24 decoration products, found ${decoCount}.`);
  if (inventory.categories.length !== 18) {
    fatal.push(`Expected 18 categories, found ${inventory.categories.length}.`);
  }

  const slugs = inventory.products.map((e) => e.source.slug);
  const dupes = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
  if (dupes.length > 0) fatal.push(`Duplicate product slugs: ${[...new Set(dupes)].join(", ")}`);
  for (const slug of slugs) {
    if (!SLUG_PATTERN.test(slug) || slug.length > 160) fatal.push(`Invalid product slug: "${slug}"`);
  }

  const categoryKeys = new Set(
    inventory.categories.map((e) => `${e.departmentSlug}::${e.source.slug}`),
  );
  if (categoryKeys.size !== inventory.categories.length) {
    fatal.push("Duplicate department-scoped category keys detected.");
  }

  const slugSet = new Set(slugs);
  for (const entry of inventory.products) {
    const p = entry.source;
    if (!categoryKeys.has(`${entry.departmentSlug}::${p.category}`)) {
      fatal.push(`Product "${p.slug}" references unknown category "${p.category}" in "${entry.departmentSlug}".`);
    }
    if (!p.name || !p.shortDescription || !p.description || !p.material || !p.color) {
      fatal.push(`Product "${p.slug}" is missing a required text field.`);
    }
    for (const price of [p.price, p.compareAtPrice]) {
      if (price === undefined) continue;
      if (!Number.isInteger(price) || price < 0 || price > 1_000_000) {
        fatal.push(`Product "${p.slug}" has an out-of-contract price: ${price}.`);
      }
    }
    if (!(p.availability in AVAILABILITY_MAP)) {
      fatal.push(`Product "${p.slug}" has unsupported availability: "${p.availability}".`);
    }
    if (p.images.length === 0) fatal.push(`Product "${p.slug}" has no images.`);
    for (const image of p.images) {
      if (typeof image !== "string" || image === "") {
        fatal.push(`Product "${p.slug}" has an invalid image reference.`);
      }
    }
    const dims = p.dimensions;
    if (!(dims.width > 0 && dims.height > 0 && dims.depth > 0) || (dims.unit !== "cm" && dims.unit !== "in")) {
      fatal.push(`Product "${p.slug}" has invalid dimensions.`);
    }
    for (const alt of p.alternatives) {
      if (alt === p.slug) fatal.push(`Product "${p.slug}" lists itself as an alternative.`);
      if (!slugSet.has(alt)) fatal.push(`Product "${p.slug}" references unknown alternative "${alt}".`);
    }
  }

  for (const edge of inventory.alternativeEdges) {
    const reverse = inventory.alternativeEdges.some((e) => e.from === edge.to && e.to === edge.from);
    if (!reverse) warnings.push(`One-directional alternative: "${edge.from}" → "${edge.to}" (stored symmetrically).`);
  }

  for (const collection of inventory.collections) {
    if (!SLUG_PATTERN.test(collection.slug)) fatal.push(`Invalid collection slug: "${collection.slug}"`);
    for (const member of collection.products) {
      if (!slugSet.has(member)) fatal.push(`Collection "${collection.slug}" references unknown product "${member}".`);
    }
    if (new Set(collection.products).size !== collection.products.length) {
      fatal.push(`Collection "${collection.slug}" lists a duplicate member.`);
    }
  }

  for (const url of inventory.mediaUrls) {
    if (mimeFromExtension(url) === "application/octet-stream") {
      warnings.push(`Unknown extension, generic MIME stored: ${url}`);
    }
  }

  // Zod contract check: every product/category/department/collection/media
  // input must satisfy the same schemas the dashboard writes through.
  for (const entry of inventory.products) {
    const p = entry.source;
    const parsed = productCreateInputSchema.safeParse({
      slug: p.slug,
      name: p.name,
      priceCents: toCents(p.price),
      compareAtPriceCents: p.compareAtPrice === undefined ? null : toCents(p.compareAtPrice),
      shortDescription: p.shortDescription,
      description: p.description,
      departmentId: entry.departmentSlug,
      categoryId: `${entry.departmentSlug}::${p.category}`,
      comparisonGroupId: p.comparisonGroup,
      material: p.material,
      materials: [],
      color: p.color,
      colorFamily: null,
      availability: AVAILABILITY_MAP[p.availability as keyof typeof AVAILABILITY_MAP],
      dimensions: p.dimensions,
      features: p.features,
      tags: p.tags,
      isFeatured: p.featured ?? false,
      isBestseller: p.bestseller ?? false,
      isNewArrival: p.newArrival ?? false,
      status: "PUBLISHED",
      publishedAt: new Date().toISOString(),
    });
    if (!parsed.success) {
      fatal.push(`Product "${p.slug}" fails the dashboard Zod contract: ${parsed.error.issues[0]?.message ?? "invalid"}`);
    }
  }

  return { fatal, warnings };
}

// ---------------------------------------------------------------------------
// Database client (local construction; mirrors src/lib/server/prisma.ts)
// ---------------------------------------------------------------------------

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "";
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured. Set it in .env (see .env.example).");
  }
  const useSsl = /(sslmode=require|sslmode=verify-full|ssl=true)/i.test(connectionString);
  const adapter = new PrismaPg({
    connectionString,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  return new PrismaClient({ adapter });
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

interface EntityCounts {
  created: number;
  updated: number;
}

interface MigrationReport {
  departments: EntityCounts;
  comparisonGroups: EntityCounts;
  categories: EntityCounts;
  mediaAssets: EntityCounts;
  products: EntityCounts;
  productImages: EntityCounts;
  alternatives: EntityCounts;
  collections: EntityCounts;
  collectionMembers: EntityCounts;
  warnings: string[];
}

const zeroCounts = (): EntityCounts => ({ created: 0, updated: 0 });

function checkZod(result: { success: boolean; error?: { issues: { message?: unknown }[] } }, context: string): void {
  if (!result.success) {
    const message = result.error?.issues[0]?.message;
    throw new Error(`${context} failed Zod validation: ${typeof message === "string" ? message : "invalid input"}`);
  }
}

async function migrate(prisma: PrismaClient, inventory: Inventory): Promise<MigrationReport> {
  const report: MigrationReport = {
    departments: zeroCounts(),
    comparisonGroups: zeroCounts(),
    categories: zeroCounts(),
    mediaAssets: zeroCounts(),
    products: zeroCounts(),
    productImages: zeroCounts(),
    alternatives: zeroCounts(),
    collections: zeroCounts(),
    collectionMembers: zeroCounts(),
    warnings: [],
  };
  // Single consistent timestamp for all PUBLISHED rows created by this run.
  // Documented as the migration timestamp, NOT an original publication date.
  const migrationTimestamp = new Date();

  // -- Departments -----------------------------------------------------------
  const departmentIds = new Map<string, string>();
  for (const dept of inventory.departments) {
    checkZod(departmentCreateInputSchema.safeParse({ slug: dept.slug, name: dept.name, order: dept.order }), `Department "${dept.slug}"`);
    const existing = await prisma.department.findUnique({ where: { slug: dept.slug } });
    if (existing) {
      const row = await prisma.department.update({
        where: { slug: dept.slug },
        data: { name: dept.name, order: dept.order },
      });
      departmentIds.set(dept.slug, row.id);
      report.departments.updated += 1;
    } else {
      const row = await prisma.department.create({
        data: { slug: dept.slug, name: dept.name, order: dept.order, isVisible: true },
      });
      departmentIds.set(dept.slug, row.id);
      report.departments.created += 1;
    }
  }

  // -- Comparison groups ------------------------------------------------------
  const groupIds = new Map<string, string>();
  for (const group of inventory.comparisonGroups) {
    const existing = await prisma.comparisonGroup.findUnique({ where: { slug: group.slug } });
    if (existing) {
      const row = await prisma.comparisonGroup.update({
        where: { slug: group.slug },
        data: { name: group.name, order: group.order },
      });
      groupIds.set(group.slug, row.id);
      report.comparisonGroups.updated += 1;
    } else {
      const row = await prisma.comparisonGroup.create({
        data: { slug: group.slug, name: group.name, order: group.order },
      });
      groupIds.set(group.slug, row.id);
      report.comparisonGroups.created += 1;
    }
  }

  // -- Media assets (content-addressed by storageUrl; existing rows untouched) --
  const mediaIds = new Map<string, string>();
  const existingAssets = await prisma.mediaAsset.findMany({ select: { id: true, storageUrl: true } });
  for (const asset of existingAssets) {
    if (!mediaIds.has(asset.storageUrl)) mediaIds.set(asset.storageUrl, asset.id);
  }
  for (const url of inventory.mediaUrls) {
    if (mediaIds.has(url)) continue;
    checkZod(
      mediaAssetCreateInputSchema.safeParse({
        storageUrl: url,
        mimeType: mimeFromExtension(url),
        sizeBytes: 0,
        width: null,
        height: null,
        altText: null,
      }),
      `Media asset "${url}"`,
    );
    const row = await prisma.mediaAsset.create({
      data: {
        storageUrl: url,
        mimeType: mimeFromExtension(url),
        // 0 = unknown at migration (required field, no source). Dashboard-editable.
        sizeBytes: 0,
        width: null,
        height: null,
        // Null: storefronts already derive alt text from the product name.
        altText: null,
      },
    });
    mediaIds.set(url, row.id);
    report.mediaAssets.created += 1;
    if (mimeFromExtension(url) === "application/octet-stream") {
      report.warnings.push(`Generic MIME stored for: ${url}`);
    }
  }

  // -- Categories --------------------------------------------------------------
  const categoryIds = new Map<string, string>();
  for (const entry of inventory.categories) {
    const departmentId = departmentIds.get(entry.departmentSlug);
    if (!departmentId) throw new Error(`Department "${entry.departmentSlug}" was not migrated.`);
    const source = entry.source;
    const imageId = mediaIds.get(source.image);
    if (!imageId) throw new Error(`Category "${source.slug}" image was not registered: ${source.image}`);
    checkZod(
      categoryCreateInputSchema.safeParse({
        departmentId,
        slug: source.slug,
        name: source.name,
        tagline: source.tagline,
        description: source.description,
        imageId,
        order: source.order,
        isVisible: true,
      }),
      `Category "${entry.departmentSlug}/${source.slug}"`,
    );
    const key = `${entry.departmentSlug}::${source.slug}`;
    const existing = await prisma.category.findUnique({
      where: { departmentId_slug: { departmentId, slug: source.slug } },
    });
    const content = {
      name: source.name,
      tagline: source.tagline,
      description: source.description,
      imageId,
      order: source.order,
    };
    if (existing) {
      // isVisible preserved (admin-owned).
      const row = await prisma.category.update({ where: { id: existing.id }, data: content });
      categoryIds.set(key, row.id);
      report.categories.updated += 1;
    } else {
      const row = await prisma.category.create({
        data: { departmentId, slug: source.slug, ...content, isVisible: true },
      });
      categoryIds.set(key, row.id);
      report.categories.created += 1;
    }
  }

  // -- Products (+ image sets, one transaction per product) --------------------
  const productIds = new Map<string, string>();
  for (const entry of inventory.products) {
    const p = entry.source;
    const departmentId = departmentIds.get(entry.departmentSlug);
    const categoryId = categoryIds.get(`${entry.departmentSlug}::${p.category}`);
    const comparisonGroupId = groupIds.get(p.comparisonGroup);
    if (!departmentId || !categoryId || !comparisonGroupId) {
      throw new Error(`Product "${p.slug}" has an unresolved relation.`);
    }
    const scalar = {
      name: p.name,
      priceCents: toCents(p.price),
      compareAtPriceCents: p.compareAtPrice === undefined ? null : toCents(p.compareAtPrice),
      shortDescription: p.shortDescription,
      description: p.description,
      departmentId,
      categoryId,
      comparisonGroupId,
      material: p.material,
      materials: [] as string[],
      color: p.color,
      colorFamily: null as string | null,
      availability: AVAILABILITY_MAP[p.availability as keyof typeof AVAILABILITY_MAP],
      // Fresh literal (not the static interface): Prisma's InputJsonValue
      // requires an index signature, which named interfaces lack.
      dimensions: {
        width: p.dimensions.width,
        height: p.dimensions.height,
        depth: p.dimensions.depth,
        unit: p.dimensions.unit,
      },
      features: p.features,
      tags: p.tags,
      isFeatured: p.featured ?? false,
      isBestseller: p.bestseller ?? false,
      isNewArrival: p.newArrival ?? false,
    };
    const imageRows = p.images.map((url, index) => {
      const mediaAssetId = mediaIds.get(url);
      if (!mediaAssetId) throw new Error(`Product "${p.slug}" image was not registered: ${url}`);
      return { mediaAssetId, position: index, altText: null as string | null };
    });

    const preexisting = await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } });
    await prisma.$transaction(async (tx) => {
      const row = await tx.product.upsert({
        where: { slug: p.slug },
        // status/publishedAt only on create; preserved on existing rows.
        create: { slug: p.slug, ...scalar, status: "PUBLISHED", publishedAt: migrationTimestamp },
        update: scalar,
      });
      await tx.productImage.deleteMany({ where: { productId: row.id } });
      if (imageRows.length > 0) {
        await tx.productImage.createMany({
          data: imageRows.map((image) => ({ productId: row.id, ...image })),
        });
      }
      productIds.set(p.slug, row.id);
    });
    if (preexisting) {
      report.products.updated += 1;
    } else {
      report.products.created += 1;
    }
    report.productImages.created += imageRows.length;
  }

  // -- Alternatives (symmetric closure, one transaction per product) ------------
  for (const entry of inventory.products) {
    const productId = productIds.get(entry.source.slug);
    if (!productId) throw new Error(`Product "${entry.source.slug}" was not migrated.`);
    const targetIds = [...new Set(entry.source.alternatives.map((slug) => {
      const id = productIds.get(slug);
      if (!id) throw new Error(`Alternative "${slug}" of "${entry.source.slug}" was not migrated.`);
      return id;
    }))].filter((id) => id !== productId);
    await prisma.$transaction(async (tx) => {
      await tx.productAlternative.deleteMany({
        where: { OR: [{ productId }, { alternativeProductId: productId }] },
      });
      if (targetIds.length > 0) {
        await tx.productAlternative.createMany({
          data: targetIds.flatMap((alternativeId) => [
            { productId, alternativeProductId: alternativeId },
            { productId: alternativeId, alternativeProductId: productId },
          ]),
        });
      }
    });
    report.alternatives.created += targetIds.length * 2;
  }
  // Report actual stored rows, not writes: later products' symmetric rewrites
  // replace rows created for earlier products, so the write total overstates
  // the final row count (e.g. 168 writes converge to 84 rows / 42 pairs).
  report.alternatives.created = await prisma.productAlternative.count();

  // -- Collections (upsert + full membership re-sync, one tx per collection) ----
  for (const collection of inventory.collections) {
    checkZod(
      collectionCreateInputSchema.safeParse({
        slug: collection.slug,
        name: collection.name,
        eyebrow: collection.eyebrow,
        description: collection.description,
        isVisible: true,
      }),
      `Collection "${collection.slug}"`,
    );
    const memberIds = collection.products.map((slug) => {
      const id = productIds.get(slug);
      if (!id) throw new Error(`Collection "${collection.slug}" member "${slug}" was not migrated.`);
      return id;
    });
    const existing = await prisma.collection.findUnique({ where: { slug: collection.slug } });
    let collectionId: string;
    if (existing) {
      const row = await prisma.collection.update({
        where: { id: existing.id },
        data: { name: collection.name, eyebrow: collection.eyebrow, description: collection.description },
      });
      collectionId = row.id;
      report.collections.updated += 1;
    } else {
      const row = await prisma.collection.create({
        data: {
          slug: collection.slug,
          name: collection.name,
          eyebrow: collection.eyebrow,
          description: collection.description,
          isVisible: true,
        },
      });
      collectionId = row.id;
      report.collections.created += 1;
    }
    await prisma.$transaction(async (tx) => {
      await tx.collectionProduct.deleteMany({ where: { collectionId } });
      if (memberIds.length > 0) {
        await tx.collectionProduct.createMany({
          data: memberIds.map((productId, position) => ({ collectionId, productId, position })),
        });
      }
    });
    report.collectionMembers.created += memberIds.length;
  }

  return report;
}

// ---------------------------------------------------------------------------
// Verification: DATABASE == STATIC SOURCE for every supported field
// ---------------------------------------------------------------------------

/** Canonical JSON serialization (sorted object keys) for order-insensitive comparison. */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableJson(entryValue)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

async function verify(prisma: PrismaClient, inventory: Inventory): Promise<string[]> {
  const mismatches: string[] = [];

  const departments = await prisma.department.findMany();
  if (departments.length !== inventory.departments.length) {
    mismatches.push(`Departments: db=${departments.length} expected=${inventory.departments.length}`);
  }

  const categories = await prisma.category.findMany({ include: { department: true } });
  if (categories.length !== inventory.categories.length) {
    mismatches.push(`Categories: db=${categories.length} expected=${inventory.categories.length}`);
  }

  const products = await prisma.product.findMany({
    include: {
      department: true,
      category: true,
      comparisonGroup: true,
      images: { orderBy: { position: "asc" }, include: { mediaAsset: true } },
    },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  if (products.length !== inventory.products.length) {
    mismatches.push(`Products: db=${products.length} expected=${inventory.products.length}`);
  }

  for (const entry of inventory.products) {
    const p = entry.source;
    const row = bySlug.get(p.slug);
    if (!row) {
      mismatches.push(`Missing product in DB: ${p.slug}`);
      continue;
    }
    const checks: [string, unknown, unknown][] = [
      ["name", row.name, p.name],
      ["department", row.department.slug, entry.departmentSlug],
      ["category", row.category.slug, p.category],
      ["priceCents", row.priceCents, toCents(p.price)],
      ["compareAtPriceCents", row.compareAtPriceCents, p.compareAtPrice === undefined ? null : toCents(p.compareAtPrice)],
      ["availability", row.availability, AVAILABILITY_MAP[p.availability as keyof typeof AVAILABILITY_MAP]],
      ["status", row.status, "PUBLISHED"],
      ["material", row.material, p.material],
      ["color", row.color, p.color],
      ["comparisonGroup", row.comparisonGroup.slug, p.comparisonGroup],
      ["isFeatured", row.isFeatured, p.featured ?? false],
      ["isBestseller", row.isBestseller, p.bestseller ?? false],
      ["isNewArrival", row.isNewArrival, p.newArrival ?? false],
      ["shortDescription", row.shortDescription, p.shortDescription],
      ["description", row.description, p.description],
      ["features", JSON.stringify(row.features), JSON.stringify(p.features)],
      ["tags", JSON.stringify(row.tags), JSON.stringify(p.tags)],
      // JSON object equality is key-order insensitive: PostgreSQL jsonb
      // normalizes stored key order, so compare canonically, not literally.
      ["dimensions", stableJson(row.dimensions), stableJson(p.dimensions)],
      ["imageCount", row.images.length, p.images.length],
      ["imageOrder", JSON.stringify(row.images.map((i) => i.mediaAsset.storageUrl)), JSON.stringify(p.images)],
    ];
    for (const [field, actual, expected] of checks) {
      if (actual !== expected) mismatches.push(`${p.slug}.${field}: db=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
    }
    if (row.publishedAt === null) mismatches.push(`${p.slug}.publishedAt: null, expected migration timestamp`);
  }

  const published = await prisma.product.count({ where: { status: "PUBLISHED" } });
  const draft = await prisma.product.count({ where: { status: "DRAFT" } });
  const archived = await prisma.product.count({ where: { status: "ARCHIVED" } });
  if (published !== inventory.products.length || draft !== 0 || archived !== 0) {
    mismatches.push(`Status counts: published=${published} draft=${draft} archived=${archived} (expected all ${inventory.products.length} published on fresh seed)`);
  }

  // Alternatives contract (09A.5): the static source lists both directions of
  // every relationship, so the database must hold exactly the same unordered
  // pair set — each pair with exactly two directed rows, no self-references,
  // no orphans. One stored row per directed source entry (NOT doubled).
  const unorderedKey = (a: string, b: string): string => (a < b ? `${a}<>${b}` : `${b}<>${a}`);
  const sourcePairs = new Set(
    inventory.alternativeEdges.map((edge) => unorderedKey(edge.from, edge.to)),
  );
  const altRows = await prisma.productAlternative.findMany({
    include: {
      product: { select: { slug: true } },
      alternativeProduct: { select: { slug: true } },
    },
  });
  const slugSet = new Set((await prisma.product.findMany({ select: { slug: true } })).map((p) => p.slug));
  const dbPairs = new Set(altRows.map((row) => unorderedKey(row.product.slug, row.alternativeProduct.slug)));
  for (const pair of sourcePairs) {
    if (!dbPairs.has(pair)) mismatches.push(`Alternative pair in source but missing in DB: ${pair}`);
  }
  for (const pair of dbPairs) {
    if (!sourcePairs.has(pair)) mismatches.push(`Alternative pair in DB but missing in source: ${pair}`);
  }
  const pairRowCounts = new Map<string, number>();
  for (const row of altRows) {
    const key = unorderedKey(row.product.slug, row.alternativeProduct.slug);
    pairRowCounts.set(key, (pairRowCounts.get(key) ?? 0) + 1);
    if (row.product.slug === row.alternativeProduct.slug) {
      mismatches.push(`Alternative self-reference in DB: ${row.product.slug}`);
    }
    if (!slugSet.has(row.product.slug) || !slugSet.has(row.alternativeProduct.slug)) {
      mismatches.push(`Alternative orphan reference in DB: ${row.product.slug} → ${row.alternativeProduct.slug}`);
    }
  }
  for (const [pair, count] of pairRowCounts) {
    if (count !== 2) mismatches.push(`Alternative pair ${pair} has ${count} directed rows (expected exactly 2)`);
  }

  return mismatches;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function printInventory(inventory: Inventory): void {
  console.log("Hype catalog inventory (static source):");
  console.log(`  Departments:      ${inventory.departments.map((d) => d.slug).join(", ")}`);
  console.log(`  Categories:       ${inventory.categories.length} (furniture=${inventory.categories.filter((c) => c.departmentSlug === "furniture").length}, decoration=${inventory.categories.filter((c) => c.departmentSlug === "decoration").length})`);
  console.log(`  Products:         ${inventory.products.length} (furniture=${inventory.products.filter((e) => e.departmentSlug === "furniture").length}, decoration=${inventory.products.filter((e) => e.departmentSlug === "decoration").length})`);
  console.log(`  ComparisonGroups: ${inventory.comparisonGroups.length}`);
  console.log(`  MediaAssets:      ${inventory.mediaUrls.length} unique references`);
  console.log(`  Alt. edges:       ${inventory.alternativeEdges.length} directed (stored symmetrically)`);
  console.log(`  Collections:      ${inventory.collections.map((c) => `${c.slug}(${c.products.length})`).join(", ")}`);
}

function printReport(report: MigrationReport): void {
  const line = (label: string, counts: EntityCounts) =>
    console.log(`  ${label.padEnd(18)} ${counts.created} created / ${counts.updated} updated`);
  console.log("Migration report (actual execution):");
  line("Departments:", report.departments);
  line("ComparisonGroups:", report.comparisonGroups);
  line("Categories:", report.categories);
  line("MediaAssets:", report.mediaAssets);
  line("Products:", report.products);
  console.log(`  ProductImages:     ${report.productImages.created} created (sets re-synced)`);
  console.log(`  Alternatives:      ${report.alternatives.created} rows (symmetric pairs)`);
  line("Collections:", report.collections);
  console.log(`  CollectionMembers: ${report.collectionMembers.created} memberships (re-synced)`);
  console.log(`  Warnings:          ${report.warnings.length}`);
  for (const warning of report.warnings) console.log(`    - ${warning}`);
  console.log("  Errors:            0");
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  if (args.has("--help")) {
    console.log("Usage: npm run db:seed [-- --dry-run | --verify]");
    console.log("  (default)  validate the static catalog, then migrate it into PostgreSQL.");
    console.log("  --dry-run  validate + print inventory only. No database needed.");
    console.log("  --verify   compare PostgreSQL against the static catalog. Needs DATABASE_URL.");
    return;
  }

  const inventory = buildInventory();
  const validation = validateInventory(inventory);
  printInventory(inventory);
  if (validation.warnings.length > 0) {
    console.log(`Validation warnings (${validation.warnings.length}):`);
    for (const warning of validation.warnings) console.log(`  - ${warning}`);
  }
  if (validation.fatal.length > 0) {
    console.error(`FATAL validation errors (${validation.fatal.length}) — aborting before any write:`);
    for (const error of validation.fatal) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log("Validation: OK (contracts hold, references resolve).");

  if (args.has("--dry-run")) {
    console.log("Dry run: no database touched.");
    return;
  }

  let prisma: PrismaClient;
  try {
    prisma = createClient();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Database is not configured.");
    process.exitCode = 1;
    return;
  }

  try {
    if (args.has("--verify")) {
      const mismatches = await verify(prisma, inventory);
      if (mismatches.length === 0) {
        console.log("Verify: DATABASE == STATIC SOURCE for all supported fields.");
      } else {
        console.error(`Verify: ${mismatches.length} mismatch(es):`);
        for (const mismatch of mismatches) console.error(`  - ${mismatch}`);
        process.exitCode = 1;
      }
      return;
    }

    const report = await migrate(prisma, inventory);
    printReport(report);
    console.log("Migration complete. Public site untouched (still static until Phase 09).");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exitCode = 1;
});
