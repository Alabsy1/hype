# Security Hardening — Phase 11

> Status labels used below: **IMPLEMENTED** (in code, verified live),
> **DEFERRED** (consciously not done), **PRODUCTION PREREQUISITE** (must exist
> before real-world deployment). Nothing is claimed beyond what was tested.

## 1. Security architecture

```
Browser
  ↓ middleware (headers + CSP nonce only — never access decisions)
Next.js Server Components / Server Actions (Node runtime)
  ↓ requireRole/requireAdmin → Zod parse → repository/service
Prisma (parameterized queries only; no raw SQL anywhere) → Neon PostgreSQL
```

Deny-by-default: every dashboard mutation authenticates + authorizes before
parsing or mutating; public reads enforce published/visible gates in the
service layer; client UI is never a boundary (verified: zero server imports
in client components).

## 2. Authentication security — IMPLEMENTED (foundation, verified)

Unchanged mechanics, re-audited: generic `"Invalid credentials."` for
unknown/wrong/inactive/malformed; dummy-hash timing equalization on misses;
bcrypt cost 12 preserved; no plaintext storage/logging; hashes never leave
server-only code (sweep: `passwordHash` only in `InternalUserRecord`,
auth-only select, create input); email trim+lowercase identical at
register/login; login creates a FRESH random session (no fixation — the
pre-login cookie is always overwritten, never reused).

## 3. Session security — IMPLEMENTED (foundation, verified live)

- 256-bit `randomBytes` tokens; only SHA-256 `tokenHash` persisted.
- Cookie: HttpOnly, Secure-in-production, SameSite=Lax, Path=/, explicit
  7-day expiry matching the DB row.
- Expiry enforced + lazily deleted (verified live: backdated session →
  login redirect + row gone). Tampered tokens miss the lookup → redirect
  (verified live). Logout revokes idempotently + clears cookie.
- Rotation: **accepted as-is** (fixed 7-day sessions + logout revocation).
  Rotation without theft-detection signal adds logout-loop risk for no
  measurable gain; revisit with device/session management UI.

## 4. Authorization — IMPLEMENTED + 1 fix

- All 16 dashboard mutations call `requireAdmin()` (directly or via
  `ensureAdmin()`) BEFORE parsing input or touching the DB (audited
  per-action; order is authenticate → authorize → parse → validate → mutate).
- IDOR: no customer-owned resources exist, so object auth = admin gate
  before access — holds everywhere. `updateCategory` resolves the stable
  `(departmentId, slug)` key server-side; collection moves recompute order
  from DB rows, never trusting client-supplied positions alone.
- Role escalation: impossible — registration schema has no role field
  (strict reject), `registerCustomerUser` hardcodes `CUSTOMER`, roles come
  only from the DB row. Verified live (crafted `role=ADMIN` ignored).
- Fix: `archiveProductAction`'s `returnTo` now goes through
  `getSafeRedirect` (was prefix-check only; backslash-external edge closed).
- Denials emit a safe server log (`auth.denied` with required vs actual role
  only — never identity) via the extracted, unit-tested `assertRole()`.

## 5. Rate limiting — IMPLEMENTED (DB-backed)

New `RateLimitEvent` model (additive migration, indexed, pruned
opportunistically) — Neon-backed sliding windows, correct on
multi-instance/serverless where process memory is not. No Redis/KV exists;
no credentials invented.
- login: 10/10min per normalized email + 60/10min per IP (XFF first entry,
  best-effort, documented spoofable — always the second layer, never the
  sole gate). Checked BEFORE bcrypt.
- register: 10/hour per IP, checked before any write.
- Throttled responses are generic (`Too many attempts…`), identical for
  known/unknown emails. Success resets the per-email window (never wedges
  legitimate users); no account ever locks.
- Limiter errors fail OPEN (documented availability choice); mutations stay
  role-gated regardless.
- Verified live: exactly N admitted, N+1 denied, reset re-admits, stale rows
  excluded. Admin bootstrap (local CLI) needs none — shell access already
  implies full control.

## 6. CSRF — IMPLEMENTED (framework-provided, verified scope)

All mutations are Server Actions (Next.js origin/host validation) with
`SameSite=Lax` session cookies. There are **zero** Route Handlers, zero
cross-origin APIs, zero CORS headers — nothing custom to protect, nothing
added. No CSRF library (would be dead weight).

## 7. Redirect security — IMPLEMENTED + 1 fix

Single sanitizer (`getSafeRedirect`: internal paths only; rejects absolute,
protocol-relative, backslash, control chars, `javascript:`/`data:`,
over-length). Verified live against 6 attack shapes. All redirect sites
audited: login (role-aware), register/logout (`/`), creates (DB-id paths),
archive (hardened this phase), layout (constant).

## 8. Headers — IMPLEMENTED (verified live on 7 routes + 404 + redirect)

Via edge-safe `src/middleware.ts` (headers only, no auth/DB): CSP (below),
`nosniff`, `DENY` + `frame-ancestors 'none'`, `strict-origin-when-
cross-origin`, minimal Permissions-Policy (camera/mic/geolocation; payment
deliberately omitted for future checkout), HSTS 1yr+subdomains (inert over
HTTP), `poweredByHeader: false` (confirmed gone).

## 9. CSP — IMPLEMENTED (nonce-based, empirically verified)

Per-request nonce middleware; policy: `default 'self'`, scripts `'self'`
+ nonce, styles `'self'` (zero `<style>` tags and zero style props in the
app — audited), images `'self' data:`, fonts `'self'` (next/font
self-hosted), connect/form `'self'`, `frame-ancestors 'none'`,
`base-uri 'self'`, `object-src 'none'`. **No `unsafe-inline`/`unsafe-eval`
anywhere.** Verified programmatically per response: every inline script
(Next flight bootstrap) carries the header's exact nonce; `X-Powered-By`
absent. Browser-console sign-off remains an operator step (no browser
tooling here) — stated, not claimed.

## 10. Input validation — IMPLEMENTED (audited, no gaps found)

Zod-strict schemas at every boundary (auth, catalog CRUD, media, settings,
JSON settings values pre-parsed); FormData accessors type-guard + trim;
numerics validated finite/integer/non-negative before schemas; enums/sorts
whitelisted; slugs/IDs resolve via unique lookups (miss → safe
notFound/error, never exception leak); pagination clamped; search terms go
through parameterized Prisma `contains`.

## 11. Error handling — IMPLEMENTED

Typed `DataLayerError`/`AuthError` hierarchies mapped to generic UI
messages; no Prisma/SQL/stack/path/env leakage (swept); no error.tsx exists
— Next's default production error page is the generic fallback
(documented as acceptable; a branded error page is future polish, not a
security gap).

## 12. Environment/secrets — IMPLEMENTED (audited clean)

`.env*` + `.neon` gitignored (not a git repo; still enforced); `.env.example`
placeholders only; secret-pattern sweep clean (two `sk-` hits are
`"desk-"` substrings in static image paths — confirmed benign);
`DATABASE_URL`/`DIRECT_URL`/tokens/hashes appear in no client bundle, no
log, no report. Admin bootstrap prints email/role/active only.

## 13. Database security — IMPLEMENTED

Runtime uses pooled `DATABASE_URL`; CLI uses `DIRECT_URL` (fallback chain in
`prisma.config.ts`); credentials server-only; no metadata exposure;
deployment scripts contain no destructive commands (`migrate deploy` only —
`reset`/`push --force` absent). New migration is pure `CREATE TABLE` + index.

## 14. Dependency audit — TRIAGED, no change

`npm audit`: 4 high, all transitive via the `prisma` CLI package
(`deepmerge-ts` stack exhaustion via `@prisma/config`; 2× `mysql2`
protocol/auth issues). Fix requires downgrading Prisma 7.10 → 6.19.3
(breaking). **Deferred with rationale**: the CLI never processes request
input (deepmerge unreachable), and the project uses PostgreSQL exclusively
(mysql2 dead code — never loaded). Downgrading the ORM for dev-tool
transitives would trade real stability for theoretical coverage. Revisit on
a patched Prisma 7.x.

## 15. Upload security requirements — DOCUMENTED (no code; none exists)

Media is metadata-only today. Future uploads MUST enforce: allowlisted MIME
+ extension match, size caps, server-side image re-decode, storage
isolation per tenant/branch, random generated filenames (never client
names), no executables (block `text/html`, `application/*`, SVG scripts or
sanitize), `requireAdmin()` before upload AND delete, storage-URL
validation on read, signed URLs for anything private. No fake upload code
added.

## 16. Deferred security items (honest list)

Browser-console CSP/interaction pass; branded error page; structured audit
log sink (only stderr warns today); distributed rate-limit provider if
traffic outgrows DB counters (Upstash Redis — **production prerequisite
only if needed**, not configured); session rotation + device management;
password reset/email verification/OAuth (no infrastructure); admin user
management UI.

## 17. Production prerequisites

1. `DATABASE_URL` (pooled) + `DIRECT_URL` wired in the host env.
2. HTTPS enforced at the edge (HSTS header ships; termination is infra).
3. Provision the first admin via `npm run admin:create` on the operator's
   machine (never in CI).
4. Operator browser pass: login/register/logout, CSP console, 390/768/1440
   spot-check of auth UI.
5. Re-run `npm audit` on a schedule; revisit §14 on Prisma updates.
