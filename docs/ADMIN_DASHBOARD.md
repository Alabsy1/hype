# Admin Dashboard — Phase 07

> Status: **Phase 07 — Admin Dashboard** (full CMS over the Phase 05 data
> layer, gated by Phase 06 authentication).
> No schema redesign. Public catalog untouched (still static). No Quick Edit,
> no media uploads, no Users UI.

## 1. Dashboard architecture

```
Browser (admin)
  ↓ Server Actions + server components only
/dashboard/*  (App Router, inside DashboardLayout gate)
  ↓ requireAdmin() → Zod → Phase 05 repositories (+4 additive reads)
Prisma → PostgreSQL / Neon
```

- UI never imports Prisma, the generated client, or password/token material.
- Every mutation follows **Server Action → requireAdmin() → Zod → repository
  → Prisma**. Route protection (layout) and mutation authorization (each
  action) are separate layers; both exist.
- No public-site cache coupling: actions use `revalidatePath` only for
  dashboard freshness or `redirect` after creates/archives. Phase 09 owns
  public ISR strategy.

## 2. Route structure

| Route | Purpose |
| ----- | ------- |
| `/dashboard` | Overview: live counts (total/published/draft/archived, per-department, categories, collections, media, settings) |
| `/dashboard/products` | Search, status/department/category/availability/flag filters, sorting, pagination, archive |
| `/dashboard/products/new` | Create (defaults to DRAFT) |
| `/dashboard/products/[id]` | Edit + images + alternatives + archive |
| `/dashboard/categories` | List + department filter |
| `/dashboard/categories/new` | Create (department-scoped slug) |
| `/dashboard/categories/[id]` | Edit (original dept+slug keys preserved) |
| `/dashboard/departments` | Inline name/order/visibility editing (records from DB, never hardcoded) |
| `/dashboard/collections` | List |
| `/dashboard/collections/new` | Create |
| `/dashboard/collections/[id]` | Edit + ordered members + searchable picker + up/down reorder |
| `/dashboard/media` | Searchable asset table + register |
| `/dashboard/media/new`, `/dashboard/media/[id]` | Register / edit metadata |
| `/dashboard/settings` | List + edit + create + confirm-gated delete |

Layout (`dashboard/layout.tsx`) gates **all** child routes: signed-out →
`/login?returnTo=/dashboard`; non-admin → 403 (no dashboard data rendered).
Sidebar (desktop) / top bar (mobile) with active-route state, admin identity,
and logout. No analytics, no fake cards.

## 3–4. Authentication / authorization requirements

- Reuses Phase 06 unchanged: single `/login`, `getCurrentUser()`,
  `requireAdmin()`, `logoutAction`. No second auth system, no second Prisma
  client, no client-side role checks, no hardcoded emails.
- If no ADMIN user exists, the dashboard is unreachable by design — documented
  in `docs/AUTHENTICATION.md` (bootstrap flow still pending `DATABASE_URL`).
  Authorization is never weakened to compensate.

## 5. Product management

- List: `listProducts(ProductFilter)` with server-side search (name/slug/text/
  material/color/tags), status, department, category (department-aware),
  availability, featured/bestseller/new flags, 8-sort whitelist, 24/page
  pagination preserving the query string.
- Rows show primary image, name/slug, department · category, formatted price,
  availability + status badges, flags, updated date, Edit + confirm-gated
  Archive (no hard delete anywhere).
- Create/edit share `ProductForm` (9 grouped sections per spec). Prices enter
  as decimals and convert to integer cents via integer arithmetic
  (`src/lib/dashboard/pricing.ts` — no floating point; >2 decimals, negatives,
  and >$1M rejected). `compareAtPrice` follows the same rules.
- Slug: suggest-from-name button, always editable, format + uniqueness
  re-validated server-side; edit form warns that slug changes move future
  public URLs (stable slugs preferred).
- Status: DRAFT default on create; explicit PUBLISHED to publish; ARCHIVED via
  confirmed action only. `publishedAt` is history — set once on first publish,
  retained through archive/re-publish, never cleared.
- Images: metadata rows (media-asset picker + alt text) with up/down ordering;
  position = row order, 0 = primary. Saving **replaces** the image set
  transactionally (delete + recreate), so removing all rows removes all
  images. No uploads, no base64, no binaries in Postgres.
- Alternatives: checkbox manager (100-candidate pool + filter) writing through
  `setProductAlternatives` — symmetric rows, self-reference dropped,
  duplicates removed, unknown ids rejected, all in one transaction.

## 6. Category management

List (department filter, visibility badges, published-product counts), create,
and edit by primary key (new additive `getCategoryById`; updates still address
the `(departmentId, slug)` unique key via preserved original keys). Slug
conflicts surface as human-readable unique-value errors — global uniqueness is
correctly NOT enforced (department-scoped by schema). Visibility toggles hide
without deleting.

## 7. Department visibility

`listDepartments()` drives the page (Furniture/Decoration come from the DB).
Inline editing of name, order, and `isVisible` per department. Hiding sets the
flag only — products/categories are untouched; future public integration reads
`isVisible`. No department create/delete UI (fixed taxonomy in this phase).

## 8. Collection management

Details form plus ordered membership over the **unfiltered** member list (new
additive `getAllCollectionProducts` — the Phase 05 method intentionally shows
PUBLISHED only for public use; the editor must manage drafts too). Picker is
server-paginated + searchable (10/page), marks existing members, and relies on
upsert for duplicate safety. Reorder moves one member by swapping with its
neighbor, then rewrites the **full** position array transactionally (partial
rewrites would collide on the unique `[collectionId, position]` key). Removal
compacts positions transactionally. No invented publication fields.

## 9. Media management

Paginated, searchable table (thumbnail, URL, MIME, size, dimensions, alt text)
over new additive `listMediaAssets` (+ `createMediaAsset` / `updateMediaAsset`
and `schemas/media.schema.ts`). Register/edit accept an existing storage URL
or local `/images` path for testing. **No delete** (FK references from product
images / category images may exist). No provider selection (Blob/R2/S3/
Cloudinary all deferred).

## 10. Settings

Full listing via new additive `listSettings()` (ordered by key). Inline JSON
editors with `JSON.parse` pre-validation, creator for new keys, confirm-gated
delete. Repository re-validates key pattern + serializability. No fabricated
business configuration — the page reflects exactly what the store holds
(empty state when none).

## 11. Server Actions

One `actions.ts` per section (`create/update/archiveProductAction`,
`setAlternativesAction`, category/department/collection/media/setting
actions). Each: `requireAdmin()` (auth failures return a sign-in message, auth
errors never swallowed), FormData parsing with human messages, Zod
`parseInput`, repository call, then `redirect` (creates/archives — always
**outside** try so `NEXT_REDIRECT` isn't mapped to an error) or
`revalidatePath` + success state (in-place saves). `notFound()` signals are
re-thrown past page catch-blocks via `rethrowNotFound` (otherwise 404s would
render as generic error cards).

## 12. Validation

Client inputs (required attributes, selects, pending/disabled states) are UX
only. The security boundary is всегда server-side: dashboard pre-checks
(price/dimensions/order/JSON with human messages) + Zod schema parse
(`parseInput` → first-issue message) + repository/DB constraints (unique
conflicts → ConflictError message). Unknown-field stripping via `.strict()`
schemas; update schemas are `.partial()` so omitted fields are never wiped.

## 13. Error handling

`toActionState` maps `ValidationError` → first Zod message, `ConflictError` →
slug/unique hint, `NotFoundError` → gone-record message, `DatabaseError` →
connection message. No Prisma codes, SQL, or stacks reach the browser. Pages
catch `DatabaseError` → `<DbUnavailable/>` ("connection is not configured",
no details); other failures → safe message card.

## 14. Database dependency

- Schema **unchanged**; migration **not created** (only additive read/write
  repository methods + one Zod schema file — no model changes).
- `DATABASE_URL` still unavailable: every dashboard page was built to fail
  gracefully, and the build performs zero auth/DB queries (`/dashboard/*`
  routes are dynamic via session cookies). **No real CRUD was tested against
  PostgreSQL** — first live pass must create/edit/archive a product end to
  end once Neon is connected. Nothing was faked.

## 15. What is deferred

Public catalog DB integration (later phases), Quick Edit (Phase 10),
media upload/storage provider, Users/roles UI (no privilege-escalation
surface added), password reset, rate limiting + hardening (Phase 11),
public cache invalidation (Phase 09), admin bootstrap (still needs
`DATABASE_URL`). CompareTable decoration URL bug untouched.

## 16. Phase 08 integration considerations

Phase 08 (static catalog migration) can seed the database using the same
`productCreateInputSchema` / `categoryCreateInputSchema` contracts the
dashboard already writes through — no dashboard rewrite needed. Suggested
order: run migration scripts against staging, then verify counts on
`/dashboard` overview before any public read switches over.
