# Homepage Content Control — Featured Department

> Small CMS feature: the Admin chooses which department feeds the existing
> homepage featured-products section. No schema change, no migration, no
> redesign, no data changes.

## Setting key / value format

- Key: `homepageFeaturedDepartment` (constant
  `HOMEPAGE_FEATURED_DEPARTMENT_KEY` in `src/lib/server/homepage.ts`).
- Value: JSON string, exactly `"furniture"` or `"decoration"` — validated by
  `homepageFeaturedDepartmentSchema` (`z.enum(["furniture", "decoration"])`,
  reusing the `Department` type from `@/data/types`; no second source of truth).
- Stored via the existing `setSetting` upsert (idempotent — repeat saves keep
  a single row). Rejected before any write: arbitrary strings, empty values,
  malformed shapes, unknown departments.

## Default behavior

Missing setting → `"furniture"` (`HOMEPAGE_FEATURED_DEPARTMENT_DEFAULT`).
Invalid stored value → `"furniture"` (safe configured fallback, never an
arbitrary department). Database errors propagate as `DatabaseError` — a dead
database surfaces through the existing error behavior and never silently
falls back to static data.

## Where it is managed

`/dashboard/settings` → dedicated "Homepage Featured Department" card
(`FeaturedDepartmentForm`): Furniture / Decoration radios with the active
option badged "Current". Saved via `setHomepageFeaturedDepartmentAction`
(`requireAdmin()` first, Zod validation, `setSetting` upsert,
`revalidatePath("/dashboard/settings")`). ADMIN only; no role input exists,
so privilege escalation through the form is impossible.

## How the homepage reads it

`HomePage` (force-dynamic, so every request is fresh) awaits
`getHomepageFeaturedDepartment()` alongside its existing fetches:
- `"furniture"` → the curated `living-room` collection members (**unchanged
  behavior**, including card links to `/furniture/product`).
- `"decoration"` → `getFeatured(6, decorationProducts)` through the same
  indexed slots of the same section; cards link to `/decoration/product`.
Both pools are PUBLISHED-only by construction of `public-catalog.ts`, which
also enforces visible-department/category gates. If the selected department
is hidden, its pool resolves empty and the section renders nothing — no
crash, no hidden data leak (verified live).

## Authorization rules

Read path: public (no auth needed — it only selects already-public data).
Write path: `requireAdmin()`; CUSTOMER and unauthenticated callers receive
the standard admin-only denial without distinguishing which check failed.

## Fallback behavior

| Situation | Result |
| --- | --- |
| No setting row | Furniture (living-room collection) |
| Invalid stored value | Furniture (logged nowhere; safe default) |
| Database down | Error surfaces (no silent fallback, no static data) |
| Selected department hidden | Empty featured section, page still 200 |

## Revalidation behavior

None needed: the homepage is `force-dynamic`, so an admin save is visible
on the very next request. No ISR, no cache tags, no new caching layer. The
dashboard action revalidates `/dashboard/settings` so the control shows the
new value immediately.

## Testing performed

- Contract unit checks (real Neon): schema accepts both departments; rejects
  8 invalid shapes (wrong strings, case variants, whitespace, numbers, null,
  arrays, objects); missing → default; invalid stored → default; repeat
  writes → single row. **9/9 passed.**
- HTTP against production build with a transient admin session (created for
  the test, deleted after): dashboard renders the control; the checked radio
  matches the stored value in both modes; homepage featured shows the 6
  living-room slugs in order (furniture) with zero decoration slugs, and the
  6 featured decoration slugs in order (decoration) with zero furniture
  slugs; decoration cards link into `/decoration/product` only. **9/9 passed.**
- Default path over HTTP (setting deleted): living-room furniture. **Passed.**
- Hidden-department edge (decoration hidden + selected): homepage 200,
  featured empty, nothing leaked; restored after. **Passed.**
- Integrity: 48 products / 18 categories unchanged; departments restored
  visible; test setting row removed afterward. **Passed.**
- Not covered by automation (same boundary as Phase 10): driving the
  dashboard Server Action itself requires a browser (React action protocol
  is not curl-drivable). The action is thin glue over verified units
  (`ensureAdmin` → Zod → `setSetting`) mirroring the existing settings
  action; manual browser pass: Dashboard → Settings → switch → save →
  homepage check.
