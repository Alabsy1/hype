# Authentication & Authorization — Phases 06 + 10

> Status: **Phase 10 — Complete user authentication & account flow** (single
> unified system for visitors, customers, and admins on top of the Phase 06
> foundation). Registration at `/register` (CUSTOMER only), operational admin
> bootstrap via `npm run admin:create`, header auth states, minimal `/account`
> page. Schema change: `UserRole.CUSTOMER` added, column default flipped
> ADMIN → CUSTOMER (fail-closed); migration
> `20260929015733_add_customer_role` applied to Neon.

## 1. Authentication architecture

Custom minimal session system built directly on the Phase 04 `User` + `Session`
models — **Auth.js was deliberately NOT used**:

- The Phase 04 `Session` model stores `tokenHash` (SHA-256 of the token), not
  the plaintext `sessionToken` Auth.js database strategy requires. Adopting
  Auth.js would have forced a schema redesign plus an adapter compatibility
  gamble (`@auth/prisma-adapter` targets the pre-7 Prisma client API; this
  project pins Prisma 7.10.0 with the `prisma-client` generator + `pg` driver
  adapter).
- The custom system is ~300 lines of auditable server-only code with zero
  framework surface: `src/lib/server/auth/` + two focused repositories.

Flow:

```
LOGIN:   /login → Server Action → authenticateUser → createSession (DB row
         with token hash) → HttpOnly cookie → redirect to /dashboard
REQUEST: cookie → SHA-256 → Session.tokenHash lookup → expiry check →
         user load → AuthUser (or null)
LOGOUT:  cookie → hash → delete Session row → clear cookie → /login
```

Authorization always runs server-side before any Phase 05 repository call.

## 2. Login flow

Single route: **`/login`** (the only login for customers, staff, editors,
admins, furniture, decoration, dashboard — no per-area logins).

1. `LoginPage` (server component) redirects already-signed-in users via the
   role-aware rule (§2.1); otherwise renders `LoginForm` (`useActionState`,
   loading state, generic error slot) plus a link to `/register`.
2. `loginAction` (Server Action) validates with `loginInputSchema`, calls
   `authenticateUser(email, password)`, creates the session, sets the cookie,
   and redirects via the role-aware rule (§2.1).
3. Every failure path returns the identical string `"Invalid credentials."`

## 2.1 Role-aware post-login landing (`getPostLoginRedirect`)

- Admins keep their requested destination (default `/dashboard`).
- Non-admins are never sent into `/dashboard`: a `returnTo` pointing there
  (or beneath it) is rewritten to `/`, and their default is `/`. This is UX,
  not security — the dashboard gate re-checks the role on every request, so
  no redirect can escalate privilege.

## 3. Session flow

- `createSession(userId)`: `randomBytes(32)` → base64url token → SHA-256 hex
  stored as `Session.tokenHash` with `expiresAt = now + 7 days`.
- `getCurrentUser()`: cookie → hash → `findUnique({ tokenHash })` including
  the user → reject when missing/expired/inactive → return `AuthUser`.
  Expired rows are deleted lazily when encountered; `deleteExpiredSessions()`
  exists for opportunistic cleanup (no background worker in this phase).
- `Session.lastSeenAt` is intentionally **not** updated per request (avoids a
  write on every page view); the column remains available for future activity
  tracking. `User.lastLoginAt` is updated once per successful login.
- Fixed-duration sessions; **no rotation** in this phase (documented choice,
  not an omission — rotation adds logout-loop risk with no Phase 06 consumer).

## 4. Cookie configuration

| Attribute  | Value                                              |
| ---------- | -------------------------------------------------- |
| Name       | `hype_session` (constant `SESSION_COOKIE_NAME`)    |
| HttpOnly   | `true` — never visible to JavaScript               |
| Secure     | `true` in production, `false` in development       |
| SameSite   | `Lax`                                              |
| Path       | `/`                                                |
| Expiry     | explicit `expires` + `maxAge` = 7 days, matching DB|

No `NEXT_PUBLIC_*` auth values. No tokens in URLs or localStorage.

## 5. Password hashing

- **bcryptjs 3.0.3** (pure JavaScript, zero native dependencies), cost factor
  **12** (`BCRYPT_COST_FACTOR`).
- Argon2id was evaluated and deferred: `@node-rs/argon2` couples deployment
  to prebuilt native binaries across dev (Windows), CI, and the unknown
  production target; bcrypt at cost 12 is the spec-sanctioned secure
  alternative with no deployment friction.
- Policy: minimum **12** characters, maximum **72** (bcrypt truncates beyond
  72 bytes, so longer inputs are rejected rather than silently shortened).
- `hashPassword` / `verifyPassword` are async, server-only, and never log
  passwords or hashes. `verifyPassword` returns `false` (never throws) on bad
  input so callers stay uniform.

## 6. User roles

`UserRole`: `ADMIN` / `EDITOR` / `STAFF` / **`CUSTOMER`** (added in Phase 10).

- `ADMIN` is the primary administrative role; the dashboard guard requires it.
- `EDITOR` / `STAFF` remain the internal staff hierarchy (no staff UI yet).
- `CUSTOMER` is the public account role. It was added because the staff
  roles cannot represent customers: stamping public sign-ups as `STAFF`
  would silently include every customer in any future staff-gated check.
- Fail-closed default: `User.role` defaults to `CUSTOMER` (changed from
  `ADMIN` in the same migration). A user created without an explicit role
  can never become an administrator by omission. All server paths set the
  role explicitly anyway (`registerCustomerUser` → `CUSTOMER`,
  `admin:create` → `ADMIN`).
- Authorization is **never** email-based; no addresses are hardcoded.

## 7. Authorization

`src/lib/server/auth/authorization.ts` (all server-only):

- `getCurrentUser(): Promise<AuthUser | null>` — null for visitors, never throws.
- `requireSession()` — throws `UnauthenticatedError` when signed out.
- `requireRole(...roles)` — throws `UnauthenticatedError` / `ForbiddenError`.
- `requireAdmin()` — `requireRole("ADMIN")`.
- `hasRole(user, roles)` / `isAdmin(user)` — pure predicates.
- `getSafeRedirect(value, fallback)` — redirect-target validator.
- `getPostLoginRedirect(user, returnTo)` — role-aware landing (§2.1).

Phase 07 pattern for every mutation:

```
Server Action / Route Handler → getCurrentUser() → requireRole(...) →
Zod validation → Phase 05 repository → Prisma
```

## 8. Protected routes

- `/dashboard` is server-side gated by the dashboard layout: unauthenticated
  → `redirect("/login?returnTo=/dashboard")`; non-admin → 403 notice section;
  admin → full dashboard (Phase 07 UI). Every dashboard Server Action
  independently calls `requireAdmin()`.
- **No middleware** was added. Rationale: session validation is a database
  read requiring the Node runtime; guarding routes via server components
  keeps the hot path simple and avoids edge/Node middleware architecture for
  no benefit. Revisit only if route count justifies it.
- All public routes (`/`, `/furniture*`, `/decoration*`, `/compare`, `/about`,
  `/collections`, `/legal`, …) remain fully public — no login wall anywhere.

## 9. Logout

`logoutAction` (Server Action, reused by the dashboard placeholder):

1. Reads the session cookie; revokes the DB row via token hash (idempotent —
   missing/expired rows are not errors; DB failures are swallowed so logout
   never strands the user).
2. Clears the cookie unconditionally.
3. Redirects to `/login`.

Only the current session is revoked; other devices/sessions are untouched. No
"sign out everywhere" UI in this phase.

## 9.1 Registration flow (Phase 10)

Single route: **`/register`** — name, email, password, confirm password. No
role input exists (the Zod schema is `.strict()` without a role field, so a
crafted `role=ADMIN` submission is rejected before it reaches the service).

1. `registerAction` validates with `registerInputSchema` (first human-readable
   issue returned), calls `registerCustomerUser()`, creates a session exactly
   like login, and redirects to `/` (public site — never the dashboard).
2. `registerCustomerUser()`: normalizes email (trim + lowercase, identical to
   login), rejects duplicates with `"An account with this email already
   exists."` (explicit by design, no DB details), hashes with shared bcrypt,
   creates the user with **role `CUSTOMER` unconditionally**, stamps
   `lastLoginAt`, returns `AuthUser`.
3. Email normalization matches login, so `Admin@Hype.com` and
   `admin@hype.com` resolve to one account — no case-variant duplicates.

## 9.2 Admin bootstrap (Phase 10)

`npm run admin:create` — operational CLI only (no HTTP surface, no setup
page). Interactive prompts (email, optional name, no-echo password) or
`ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` env fallback for automation.
Reuses the password policy constants and bcrypt cost; validates email with
the same normalization. **Refuses if the email already exists** — never
elevates, deletes, or modifies anything (exit non-zero, no changes). Prints
only the created email/role/active flags. Standalone PrismaClient like the
seed (server-only modules cannot load in a CLI).

## 9.3 Customer behavior (Phase 10)

- Customers use the same `/login`, sessions, cookies, and logout as admins.
- After login they land on `/` (or their safe non-dashboard `returnTo`).
- `/dashboard` renders the existing 403 section for them (verified live);
  no URL, client-state, or role-field trick grants access.
- `/account` (any authenticated role) shows name/email/role/status plus
  sign-out; visitors redirect to `/login?returnTo=/account`.

## 9.4 Header auth state (Phase 10)

Root layout passes the safe `AuthUser` DTO (id/email/name/role only) to the
client `Header`, which renders: visitor → Login + Sign up; signed-in user →
account link (name), Logout, plus Dashboard link **only for ADMIN**. Same
entries exist in mobile navigation. Link visibility is convenience — every
route re-checks server-side.

## 10. Error handling

- Public login response: always `"Invalid credentials."` (malformed input,
  unknown email, wrong password, inactive account).
- Anti-enumeration: unknown/inactive accounts still pay for one bcrypt
  comparison against a dummy hash before failing.
- Internal typed errors (`InvalidCredentialsError`, `UnauthenticatedError`,
  `ForbiddenError`) never carry Prisma details; unexpected errors propagate to
  Next.js error boundaries (generic in production).
- No sensitive values are ever logged: passwords, hashes, tokens, token
  hashes, cookies, auth headers.

## 11. Security boundaries

- Every file under `src/lib/server/auth/` and the auth repositories carries
  `import "server-only"`. The only exception is `login.schema.ts` (pure Zod,
  intentionally reusable later).
- Client components (`LoginForm`) import only the Server Action — password
  verification, session creation, Prisma, and hashing stay server-side.
- Node runtime is required wherever Prisma/crypto/bcrypt run (Server Actions
  and server components default to Node here; nothing auth-related is placed
  in Edge middleware).
- CSRF: mutations travel exclusively through Server Actions, which carry
  Next.js built-in origin protections; combined with `SameSite=Lax` no custom
  CSRF framework is warranted in this phase.
- Login rate limiting is **documented as deferred** (see §14), not faked.

## 12. Environment variables

No committed secrets. `.env.example` documents only `DATABASE_URL` /
`DIRECT_URL` (placeholders). Session lifetime (`SESSION_MAX_AGE_DAYS = 7`)
and cookie name are code constants. `ADMIN_EMAIL` / `ADMIN_PASSWORD` (and
optional `ADMIN_NAME`) are consumed solely by `scripts/admin-create.ts` —
documented there and in §9.2, never committed, never printed, never sent
over HTTP.

## 13. Database dependency

- Queries are lazy: `prisma validate`, `prisma generate`, `lint`, `tsc`, and
  `next build` all pass without a live database. `/login` and `/dashboard`
  use `cookies()`, making them dynamic — they are never prerendered, so the
  build performs zero auth queries.
- Real login / session / logout persistence **cannot be verified until a real
  `DATABASE_URL` exists** (still unavailable — no credentials invented, no
  fake accounts). First live verification must exercise: login → cookie set →
  `/dashboard` allowed → logout → cookie cleared → `/dashboard` redirects.

## 14. What is intentionally deferred

| Item | Status |
| ---- | ------ |
| Dashboard UI (Phase 07) | placeholder guard only |
| Public catalog DB integration (Phase 08/09) | untouched — static data still serves |
| Quick Edit UI | authorization foundation only |
| Public registration (`/register`) | **implemented (Phase 10)** — CUSTOMER-only, auto-login, no role input |
| Password reset / forgot / change / email verification | no infrastructure — future work |
| Admin bootstrap (`npm run admin:create`) | **implemented (Phase 10)** — interactive CLI with refuse-on-exists; `ADMIN_EMAIL`/`ADMIN_PASSWORD` env fallback for automation; never prints/commits secrets, never runs during build |
| Login rate limiting | **not implemented** — an in-memory limiter would be dishonest on multi-instance deployments; real distributed limiting belongs to Phase 11 production hardening |
| Session rotation | fixed 7-day sessions by design |
| CSP / security headers | Phase 11 |

## 15. How Phase 07 should consume auth

1. Protect layouts/pages with `requireAdmin()` (or `requireRole(...)`) at the
   top of server components — before any data fetch.
2. Gate every Server Action with `requireRole(...)` first, then Zod-parse,
   then call Phase 05 repositories.
3. Use `getCurrentUser()` for identity display; never re-derive roles
   client-side.
4. Create the first admin via `npm run admin:create` (§9.2).

## 16. How future Quick Edit should consume authorization

Render edit affordances only after a server check (`isAdmin(await
getCurrentUser())` passed as a boolean prop — never the user object), and
enforce `requireRole("ADMIN" | "EDITOR")` inside each mutation action. The
server check, not the hidden button, is the gate.

## 17. Future password reset/management work

Requires email infrastructure (none exists): reset-token model + mailer +
expiry + one-time-use semantics. Explicitly out of scope until the project
needs self-service recovery; admin password changes remain a direct-database
operation documented at bootstrap time.

## Verification (Phase 06)

- `npm run prisma:validate` ✅ · `npm run prisma:generate` ✅ (no schema diff)
- `npm run lint` ✅ · `npx tsc --noEmit` ✅ (strict)
- `npm run build` ✅ — 76 static pages intact + `/login` and `/dashboard`
  dynamic (cookie-dependent, never prerendered)
- bcryptjs hash/verify round-trip verified in Node (correct accept + correct
  reject); Zod `loginInputSchema` + `getSafeRedirect` unit-exercised without a
  database (pure functions)
- No migration created; no frontend files modified; no secrets committed
- Live login/logout against PostgreSQL: **blocked on `DATABASE_URL`** (honest
  pending item, see §13)

## Verification (Phase 10)

- Schema: `UserRole.CUSTOMER` added, default `CUSTOMER`; migration
  `20260929015733_add_customer_role` (`ALTER TYPE … ADD VALUE`, `SET DEFAULT`)
  applied to Neon via `prisma migrate deploy`. User table was empty — no data
  rewrite. `prisma validate` ✅ · `prisma generate` ✅ · `tsc` ✅ · `lint` ✅ ·
  production build ✅ (includes `/register`, `/account`).
- Service harness (29 checks, real Neon, temp script deleted after): register
  creates CUSTOMER, no hash/token leakage, role input ignored, duplicate safe
  message, policy + mismatch + normalization enforced; login valid/generic/
  inactive paths; session randomness, hash-only storage, 7-day expiry,
  revocation (+ idempotent double revoke); role predicates and full
  `getPostLoginRedirect` matrix (admin keeps dashboard, customers rewritten
  to `/`, open redirects blocked). **ALL PASSED.**
- HTTP (production server): admin dashboard 200 + identity; admin homepage
  shows Dashboard link; admin `/account` shows email + role; customer header
  (Logout, account, no Dashboard), customer `/dashboard` 403 section,
  customer `/account`, visitor header (Login/Sign up, no Dashboard),
  `/register` renders; visitor/bogus sessions redirect to login; bootstrap
  refuses existing admin. **ALL PASSED.**
- Honest boundary: browser-driven form POSTs (React action protocol) are not
  drivable with curl, so the Server Action glue (parse → service → cookie →
  redirect) is verified at the service layer plus code review rather than
  through a browser. A browser-driven auth pass remains good future work
  (no test runner exists in this repo).
