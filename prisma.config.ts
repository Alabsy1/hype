import { defineConfig } from "prisma/config";

// Prisma ORM v7 does not load environment variables by default.
// Load local env files manually (Node >= 20.12) without adding a dotenv
// dependency. Order mirrors Next.js precedence: `.env.local` overrides `.env`
// (real process environment always wins; loadEnvFile never overrides it).
// Both files are git-ignored; only placeholders ship in `.env.example`.
for (const file of [".env", ".env.local"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Env files are optional for `prisma generate` / `prisma validate`.
    // DB-touching commands fail with a clear error when no URL is configured.
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma CLI (migrations, studio, db commands) prefers the DIRECT_URL
    // (Neon direct connection) and falls back to the pooled DATABASE_URL.
    // Do NOT use the `env()` helper here: it throws at config load time and
    // would break `prisma generate`/`validate` before credentials exist.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});