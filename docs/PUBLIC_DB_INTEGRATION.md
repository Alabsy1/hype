# Public DB Integration — Phase 09B

> Status: **public catalog reads PostgreSQL at runtime; static catalog retired
> from public rendering** (kept on disk for seed reference; editorial content
> intentionally static — no DB model exists for it).

## 1. Public DB architecture

```
Public Server Component / layout
  ↓ props (serializable static-shaped data)
Client Components (cards, rails, explorer, compare, header search)
  ↑
src/lib/server/public-catalog.ts  (server-only composition layer)
  ↓ Phase 05 public repositories (listPublishedProducts,
    getPublishedProductBySlug, getProductAlternatives, getProductById,
    listVisibleDepartments, getVisibleDepartmentBySlug,
    listVisibleCategoriesByDepartment,
    getVisibleCategoryByDepartmentAndSlug, listVisibleCollections,
    getCollectionProducts, getMediaAssetById)
  ↓ Prisma → Neon PostgreSQL
```

- No Prisma, repositories, or server-only modules in any client component
  (verified by import audit + clean `tsc`/`eslint` client boundaries).
- No public API routes. No Express. No second backend. No direct Prisma in
  pages (all access composes repository methods).
- `src/lib/catalog-ui.ts` holds the presentation contracts verbatim
  (filtering, sorting, search, paths, price formatting) with explicit arrays
  instead of static defaults — client behavior is byte-identical logic on
  DB-supplied data. `src/lib/catalog.ts` (static-backed) has zero importers
  and is retired from runtime.

## 2. Pages migrated

`/`, `/furniture`, `/furniture/[category]`, `/furniture/product/[slug]`,
`/decoration`, `/decoration/[category]`, `/decoration/product/[slug]`,
`/collections`, `/compare`, `/not-found` (async, DB-backed category links),
plus `force-dynamic` on `/about`, `/legal`. Root layout fetches the header
search index; footer fetches visible furniture categories itself.
`generateStaticParams` removed everywhere (dynamic pages must not bake DB
rows at build).

## 3. Phase 05 repositories/services used

Listed in §1. Additionally `getPublicDepartment` (new service helper —
visible-dept-or-null) gates department index pages. Alternatives resolve via
`getProductAlternatives` (slugs) matched against department lists in memory,
with per-slug published+visible fallback for cross-department links.
Collection members enrich via parallel `getProductById` (bounded, ≤6 per
collection) then visibility-filter. Category images resolve via
`getMediaAssetById`. No repo was modified in this phase.

## 4. Public visibility rules

Enforced in `public-catalog.ts`, never in components:
- products: `status = PUBLISHED` (repository-level)
- departments: `isVisible` (missing/hidden → null → pages `notFound()`,
  including department index pages)
- categories: `isVisible`, department-scoped (missing/hidden → null →
  `notFound()`, cascading to member products)
- collection members: same triple gate; drafts/hidden items silently excluded
- alternatives/related: published + visible only
Proven live by toggling states on production data: archived product → 404 +
excluded from category; hidden category → category + member 404; hidden
department → department/category/product 404, other department unaffected;
all states restored and re-verified with `--verify` afterwards.

## 5. Rendering strategy

`export const dynamic = "force-dynamic"` on every public route: the database
is the runtime source of truth and the build never bakes catalog rows (no
ISR/caching — deferred to a later optimization phase). Homepage rails keep
static order via `oldest` (createdAt ASC reproduces seed insertion order —
proven identical sequences for both departments).

## 6. Error handling

No static fallback anywhere: DB failure throws to Next.js default error UI
(generic, no Prisma/SQL/stack/connection details). 404s render the custom
not-found page (verified body + status). No secrets in markup or logs.

## 7. Static data's remaining role

`src/data/*` stays on disk: seed source, `--verify` reference, contract
documentation. Runtime catalog imports: zero (audit). Remaining runtime
imports are `import type` (erased) plus editorial content (`editorial`,
`decorationEditorial` — display copy with no DB representation, out of
scope by design).

## 8. Compare department-aware fix

`CompareTable` previously hardcoded `/furniture/product/[slug]` in 4 links
(the known bug — decoration pieces linked into the furniture tree). All four
now use `getProductPath(product)` (department-first). The table receives the
full published catalog as props from the server page; selection/suggestion
logic unchanged.

## 9. Alternatives contract

Unchanged from 09A.5: 84 source entries = 42 unordered pairs = 84 directed
rows, each pair exactly once per direction. Detail pages resolve slugs
through the visibility gates; nothing doubles or invents relationships.

## 10. Verification performed

- prisma validate/generate ✅ · tsc strict ✅ · eslint ✅ · production build ✅
- Live production-server battery: 10/10 routes 200 with content markers
- Negatives 7/7: missing product/category/slug per dept, cross-department
  slugs, unknown path → 404 + custom 404 body
- Visibility toggles (archive/hide-category/hide-department + restores) all
  correct; `--verify` clean afterwards (exit 0)
- Data equality: DB==static (`--verify`) plus runtime order/content checks —
  arrivals/bestsellers/living-room sequences identical, counts (24/3/3),
  price format, slugs, images all match
- Testing lesson: `Stop-Job` orphans `next start` grandchildren — always
  verify fresh PIDs / reap by command line, else tests silently hit stale
  builds (this caught one false failure during the phase)
- Responsive: no browser tooling in this environment; verified at code level
  — identical JSX/CSS/components (only data props changed), no layout or
  style edits, so 390/768/1440 behavior is structurally unchanged

## 11. Deferred work

ISR/caching/revalidation strategy; admin provisioning for interactive
dashboard-vs-live-DB check (data layer already proven); marketing copy with
hardcoded counts ("Twenty-four pieces…", "Ten ways…") left verbatim —
factually correct for the seeded catalog, revisit if admin curation changes
cardinality; `src/lib/catalog.ts` + `src/data/*` cleanup is a separate
retirement task (explicitly kept this phase).
