# Catalog Migration — Phase 08

> Status: **migration code complete and statically validated; real PostgreSQL
> execution NOT performed** — no `DATABASE_URL`/`.env` exists in this
> environment, and nothing was faked. The public website is untouched (still
> fully static); the dashboard code is untouched.

## 1. Migration source

Canonical static catalog (sole source of truth, read directly — never
retyped):

- `src/data/products.ts` — 24 furniture products (legacy entries omit
  `department`, resolving to furniture per `src/lib/catalog.ts`)
- `src/data/decorationProducts.ts` — 24 decoration products
- `src/data/categories.ts` — 10 furniture categories (order 1–10)
- `src/data/decorationCategories.ts` — 8 decoration categories (order 1–8)
- `src/data/collections.ts` — 4 real collections × 6 ordered members
- `src/data/types.ts` — `Product` / `Category` / `Collection` shapes

## 2. Expected inventory

| Entity | Expected | Verified in source |
| ------ | -------- | ------------------ |
| Departments | furniture, decoration | 24 + 24 products resolve |
| Categories | 18 (10 furniture + 8 decoration) | exact |
| Products | 48 (24 + 24) | exact |
| Product images | 108 refs (107 unique URLs), every product ≥ 1 | exact |
| Comparison groups | 18 distinct slugs | exact |
| Alternative edges | 84 directed | exact, no self-refs, none dangling |
| Collections | 4 × 6 members, all resolve | exact |
| Category images | 18 unique URLs | exact |

`npm run db:seed -- --dry-run` prints this inventory and runs the full
validation suite without touching any database.

## 3. Department mapping

`furniture` → { name "Furniture", order 0 }, `decoration` → { name
"Decoration", order 1 } (mechanical title-case; dashboard-editable).
Upsert by slug; `isVisible` preserved on existing rows, `true` on create.

## 4. Category mapping

All static fields preserved (name, slug, tagline, description, order).
`image` (a path string in static) becomes a MediaAsset row linked via
`imageId`. Department-scoped uniqueness honored (`furniture::slug` vs
`decoration::slug`). `isVisible` preserved on existing rows.

## 5. Product mapping

| Static | Database |
| ------ | -------- |
| `slug` (globally unique, kebab-valid) | `slug` verbatim — never regenerated |
| `name`, `shortDescription`, `description` | verbatim |
| `price`, `compareAtPrice?` (whole units) | `priceCents`, `compareAtPriceCents` (×100) |
| `department` (+ legacy→furniture rule) | `departmentId` |
| `category` | `categoryId` (department-scoped) |
| `comparisonGroup` | `comparisonGroupId` |
| `material` | `material`; `materials` → `[]` (no source; schema default) |
| `color` | `color`; `colorFamily` → `null` (no source) |
| `availability` | mapped exactly (below) |
| `dimensions` | verbatim JSON |
| `features`, `tags` | verbatim arrays |
| `featured?`, `bestseller?`, `newArrival?` | flags (`?? false`) |
| status/publishedAt | PUBLISHED + migration timestamp **on create only** |

Static `id` values (`p-001`…) are not migrated (DB uses cuid; slug is the
stable key). Static `thumbnail` is unused in source (0 occurrences); primary
image = `images[0]`.

## 6. Price conversion

Integer arithmetic (`×100`; static prices are whole units, all validated
integer, ≥ 0, ≤ 1,000,000 — the dashboard contract). Any violation aborts the
run before any write; nothing is rounded or silently fixed.

## 7. Status mapping

The static catalog is the public catalog, so every migrated product is
created PUBLISHED. No arbitrary drafts. Re-runs never alter `status` on
existing rows (admin-owned lifecycle).

## 8. Image strategy

Binaries never touch PostgreSQL. Each unique image URL becomes one MediaAsset
row (deduplicated by `storageUrl`); ProductImage rows carry
`position` = source array index (0 = primary), `mediaAssetId`, `altText =
null` (storefronts today render product-name-derived alt text; Phase 09 keeps
that fallback). Product image sets are replaced transactionally per product.
Local `/images/…` paths are stored verbatim — no file moves, no URL rewrites.

## 9. MediaAsset strategy

The registry is architecturally required (ProductImage.imageId and
Category.imageId are FKs). Rows: `storageUrl` verbatim, MIME derived from
extension, `sizeBytes = 0` meaning **unknown at migration** (required field,
no source — dashboard-editable), dimensions null, altText null. Existing rows
matched by URL are left untouched. No duplicates by construction (in-memory
dedupe + preload).

## 10. ComparisonGroup strategy

18 groups from distinct static slugs, upserted by slug. `name` has no source:
deterministic `startCase(slug)` derivation (mechanical, documented,
dashboard-editable — e.g. "tv-units" → "Tv Units" is a known artifact, not
editorial data). Order = alphabetical slug index. No visibility semantics
(schema has none).

## 11. Alternative strategy

84 directed static edges (fully symmetric: 42 pairs, zero one-directional
edges, none self-referential) are stored as the symmetric closure — 84 rows,
one per directed edge — using the same semantics as Phase 05
`setProductAlternatives`, one transaction per product. (The seed writes 168
rows cumulatively across per-product rewrites but reports the actual stored
row count.) One-directional static edges, if ever present, are reported as
warnings and stored symmetrically per the data model.

Contract reconciliation (09A.5): the Phase 08 report originally stated
"84 logical edges → 168 stored rows", double-counting the already-bidirectional
source. Programmatic audit of `src/data/*` proved the 84 entries are both
directions of 42 unordered pairs (0 one-directional, 0 duplicates, 0
self-refs), and the database holds exactly that pair set (42 pairs × 2
directed rows = 84 rows, zero missing reverses, zero orphans). `--verify`
now enforces this contract: identical pair sets, exactly 2 rows per pair.

## 12. Collection strategy

All 4 static collections are real — migrated with name/slug/eyebrow/
description and position-ordered membership (full re-sync per collection in
one transaction). `isVisible` preserved on existing rows. Nothing invented;
empty DB stays collection-free only if static had none (not the case).

## 13. Idempotency

Stable keys everywhere (department slug, group slug, department+slug,
product slug, collection slug, media URL). Second run yields `0 created / N
updated`, zero duplicates: upserts by unique keys, image/membership sets
re-synced (not appended), alternatives rewritten, media matched by URL. No
truncate/recreate anywhere. (Two-run proof pending live DB.)

## 14. Existing-data ownership

- Migration-owned (refreshed on re-run): all content + relationships listed
  above. Re-run only when static changes; dashboard edits to migrated content
  are intentionally overwritten — the dashboard is primary going forward.
- Admin-owned (never touched on existing rows): `status`, `publishedAt`,
  `isVisible`. MediaAsset rows: never updated once created.

## 15. Transaction boundaries

Per-entity sequential upserts for departments/groups/media/categories;
**one interactive transaction per product** (upsert + image-set replace);
**one per product** for alternatives; **one per collection** for membership.
No global mega-transaction (blast-radius control); no bare multi-writes.

## 16. Validation

`validateInventory` runs before any write and aborts on: count mismatches
(48/24/24/18), duplicate/invalid slugs, duplicate category keys, unresolvable
department/category/group/alternative/collection references, missing text
fields, out-of-contract prices, unsupported availability, empty/bad images,
bad dimensions, self-alternatives, duplicate collection members — plus a Zod
`safeParse` of every product/category/department/collection/media input
against the exact schemas the dashboard writes through.

## 17. Verification

- `--dry-run`: inventory + validation, zero DB contact (passes today).
- `--verify`: field-by-field DB-vs-static comparison (slug, name, department,
  category, price, compareAt, availability, status, material, color, group,
  flags, texts, features, tags, dimensions, image count/order/URLs,
  publishedAt non-null) plus status-count reconciliation. Pending live DB.
- Dashboard counts (`/dashboard` overview) and public-route spot checks are
  manual steps for the live run (checklist in §19).

## 18. Rollback considerations

No automated rollback (by design — additive upserts, no destructive ops, no
`migrate reset`/`db push --force-reset`/TRUNCATE anywhere near this flow).
On a failed run, fix the source/connection and re-run; idempotency converges.
Records created by a partial run are valid migrated rows, not orphans
(referential integrity is enforced per transaction).

## 19. Database dependency

**Real PostgreSQL migration was not executed because DATABASE_URL is
unavailable** (no `.env`, no env var — verified without printing secrets).
Live-run checklist once Neon is connected:

1. `npm run prisma:deploy` (apply Phase 04 migration on the target first)
2. `npm run db:seed` → expect 2/18/48/125/48 created, 84 alt rows (42 pairs), 24
   memberships, 0 errors
3. `npm run db:seed` again → 0 created everywhere, no duplicates
4. `npm run db:seed -- --verify` → zero mismatches
5. Open `/dashboard` (counts), `/dashboard/products` (search furniture/
   decoration; spot-check names, prices, statuses, images, flags),
   categories/departments/collections/media pages
6. Spot-check public routes (below) — still static

## 20. Phase 09 handoff

Phase 09 may assume: departments, categories, products, images, groups,
alternatives, collections, and media all exist with the relationships above;
the dashboard reads/manages them; static files remain intact; **no public
page reads the database yet**. Phase 09 work: route public reads through the
Phase 05 public repository methods (`status = PUBLISHED` enforced),
preserving frontend design and slug-based URLs.
