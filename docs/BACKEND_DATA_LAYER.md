# Backend Data Layer — Phase 05

> Status: **Phase 05 — Backend Data Layer** (Prisma repository/service foundation)
> Phase 04 delivered the schema and client foundation. Phase 05 builds the typed
> data-access layer on top of it — **without schema changes, migrations, API
> routes, authentication, or any modification to the static frontend.**

## 1. Purpose

Provide a single, typed, server-only data-access layer that the future
dashboard (Phase 06), public API/Server Components (Phase 07), and static
catalog migration (Phase 08) will call. It normalizes validation, errors,
pagination, filtering, sorting, and search so higher layers never touch Prisma
directly.

## 2. Directory structure

```
src/lib/server/
  prisma.ts                     Prisma singleton (adapter, SSL detection)
  schemas/
    catalog.schema.ts            Shared constants + product list query schema
    product.schema.ts            Product create/update Zod inputs
    category.schema.ts           Category create/update Zod inputs
    department.schema.ts         Department create/update Zod inputs
    collection.schema.ts         Collection create/update + reorder inputs
  errors/
    data-layer-error.ts          DataLayerError hierarchy + Prisma normalizer
  validate.ts                    parseInput(schema, data) → typed value
  pagination.ts                  Prisma skip/take + metadata helpers
  selects.ts                     Media/product summary & detail projections
  dto/
    product.dto.ts               Product DTOs + mappers (summary/detail)
    category.dto.ts              CategoryDTO + mapper
    department.dto.ts            DepartmentDTO + mapper
    collection.dto.ts            CollectionDTO + mapper
  repositories/
    products.repository.ts       Product CRUD, listing, alternatives
    categories.repository.ts     Category CRUD + department-scoped lookups
    departments.repository.ts    Department CRUD
    comparison-groups.repository.ts  Group reads + published product listing
    collections.repository.ts    Collection CRUD + membership (transactions)
    media.repository.ts          Read-only media asset access
    settings.repository.ts       SiteSetting key/value store
docs/BACKEND_DATA_LAYER.md       This document
```

## 3. Server-only boundary

| Module                  | `server-only` | Why                                                    |
| ----------------------- | ------------- | ------------------------------------------------------ |
| `schemas/*`             | no            | Future client-side forms reuse the Zod definitions     |
| `errors/*`              | yes           | Data-layer internals, never bundled to the client      |
| `validate.ts`           | yes           | Wraps server errors                                    |
| `pagination.ts`         | yes           | Holds server pagination rules                          |
| `selects.ts`, `dto/*`   | yes           | Prisma-typed projections                               |
| `repositories/*`        | yes           | Import the Prisma singleton                            |

No module in this layer may export Prisma, database credentials, or password
hashes. No `NEXT_PUBLIC_*` secrets are used. Client modules import TypeScript
types only from `@/lib/server/dto/*` (type-only, erased at compile time).

## 4. Prisma access

- All repositories import the singleton from `@/lib/server/prisma.ts` — never
  construct a `PrismaClient` in a component or route.
- Queries are lazy: repositories compile and validate without a live database.
  A real `DATABASE_URL` is required only to apply the Phase 04 migration and
  to execute runtime queries.
- No raw SQL. Transactions are used only for multi-write operations
  (collection membership/reorder, symmetric product alternatives).

## 5. Public vs admin reads

- **Public repositories** (starter methods that Phase 07 endpoints will call)
  always enforce `status = PUBLISHED` and `isVisible = true`:
  - `getPublishedProductBySlug`, `listPublishedProducts`
  - `getVisibleCategoryByDepartmentAndSlug`, `listVisibleCategories*`
  - `getVisibleDepartmentBySlug`, `listVisibleDepartments`
  - `listVisibleCollections`
  - `listPublishedProductsByComparisonGroup`
- **Admin reads** accept an optional `status` filter (`listProducts`) and
  never leak visibility/publish states into public shapes.
- Reads return `null`/`[]` when absent; mutations throw `NotFoundError`.

## 6. Validation (Zod 4)

- Inputs are parsed at the boundary with `parseInput(schema, data)`; failures
  throw `ValidationError` carrying the Zod issue list.
- Create schemas apply defaults; update schemas are `.partial()` so an update
  omitting a field never overwrites it (no `undefined` wipe).
- `slugSchema` enforces kebab-case slugs; `statusSchema`, `availabilitySchema`
  and `productSortSchema` constrain allowed values.
- Prices are integer cents (`priceCents`, `compareAtPriceCents`); DTOs expose
  cents only — no currency formatting in the data layer.
- `publishedAt` accepts an ISO-8601 datetime and is transformed to a `Date`.

## 7. Pagination

- Defaults: `DEFAULT_PAGE_SIZE = 24`, `MAX_PAGE_SIZE = 100`, `MIN_PAGE = 1`.
- `paginationSchema` coerces query params; `buildPaginationArgs` computes
  skip/take; `paginated()` returns `{ items, page, pageSize, total,
  totalPages, hasNextPage, hasPreviousPage }`.

## 8. Sorting

- Callers pass a whitelisted sort key (`newest | oldest | price-asc |
  price-desc | name-asc | name-desc | featured | bestseller`).
- The repository maps keys to safe Prisma `orderBy` arrays and adds an `id`
  tie-breaker for stable pagination. Raw `orderBy` from callers is rejected.

## 9. Search

- Text search over `name`, `slug`, `shortDescription`, `description`,
  `material`, `color`, `colorFamily` (all `contains` + `mode: insensitive`)
  plus exact `tags: { has: term }`. Terms are ANDed.
- Trigram indexes (pg_trgm) and fuzzy ranking are deferred to a later phase;
  the search is a foundation, not a full-text solution.

## 10. Filters

`ProductFilter` supports `departmentSlug`, `categorySlug` (department-aware),
`comparisonGroupSlug`, `status`, `availability`, `minPriceCents`,
`maxPriceCents`, `isFeatured`, `isBestseller`, `isNewArrival`, and `search`.

## 11. Error normalization

`toDataLayerError` maps any thrown value to the typed hierarchy:

| Prisma code / cause     | Result            |
| ----------------------- | ----------------- |
| `P2002`, `P2003`        | `ConflictError`   |
| `P2025`                 | `NotFoundError`   |
| `P100*` (connection)    | `DatabaseError`   |
| other `P1xxx` / generic | `DatabaseError`   |
| Zod failure (via layer) | `ValidationError` |

Mutations wrap Prisma calls so callers never observe raw Prisma errors.

## 12. JSON fields

`Product.dimensions` is stored as JSON and mapped to an untyped `unknown` in
`ProductDTO` (guarded by the structured Zod input schema at write time). No
DTO trusts raw stored JSON at read time.

## 13. Symmetric product alternatives

`ProductAlternative` stores both rows per pair (see Phase 04 schema comment).
`setProductAlternatives` rewrites a product's pair set inside a transaction
including both directions, validates that every target exists, excludes
self-references, and re-reads the union (`alternatives` + `alternativeOf`)
when returning results.

## 14. Collections

- Membership is ordered (`CollectionProduct.position` with unique
  `[collectionId, position]`).
- `addProductsToCollection` appends after the current max position using
  `upsert`; `removeProductsFromCollection` compacts positions;
  `reorderCollectionProducts` rewrites positions for the supplied order.
  All three run inside `$transaction`.

## 15. Settings

`SiteSetting` is a key/value JSON store. `setSetting` validates the key against
`/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/` and that the value is JSON-serializable.
`deleteSetting` returns `false` (not an error) when the key does not exist.

## 16. What Phase 05 deliberately does NOT do

- No schema or migration changes (Phase 04 remains the baseline).
- No API routes, Server Actions, dashboard, or authentication surfaces
  (Phases 06+).
- No static data migration from `src/data/*` or `src/lib/catalog.ts`
  (Phase 08).
- No ISR/caching (`unstable_cache`, `revalidate*`) — deferred.
- No direct `PrismaClient` usage outside the repository layer.

## 17. Usage sketch (Phase 07 endpoints)

```ts
// app/furniture/[category]/page.ts (future)
const result = await listPublishedProducts({
  departmentSlug: "furniture",
  categorySlug,
  page: 1,
  pageSize: 24,
  sort: "featured",
});
// result is PaginatedResult<ProductDTO> — safe to serialize into props.
```

## 18. Verification

- `npm run prisma:validate` — schema + config valid.
- `npm run prisma:generate` — client regenerated (hash unchanged, no diff).
- `npm run lint` — ESLint clean.
- `npx tsc --noEmit` — strict type-check clean.
- `npm run build` — static export retains all 76 pages; frontend untouched.
- Live Neon execution is pending a real `DATABASE_URL` (documented blocker).