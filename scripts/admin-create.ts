/**
 * Operational admin bootstrap: creates the FIRST admin User record in Neon.
 *
 *   npm run admin:create
 *
 * - Interactive: prompts for email, optional name, and password (no echo).
 * - Automation: ADMIN_EMAIL / ADMIN_PASSWORD environment variables are
 *   honored instead of prompting (never commit them anywhere).
 * - Refuses if the email already exists — never silently elevates, deletes,
 *   or modifies existing users, and touches nothing else in the database.
 * - Never prints, logs, or writes the password. Not exposed over HTTP.
 *
 * Deliberately standalone (own PrismaClient + bcryptjs, like prisma/seed.ts):
 * server modules carry `import "server-only"` and cannot load in a CLI, so
 * this reuses the same *contracts* — email normalization, password policy
 * constants, bcrypt cost — without importing server code.
 */

import * as readline from "node:readline";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { PrismaClient } from "@/generated/prisma/client";
import {
  BCRYPT_COST_FACTOR,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/server/auth/constants";

// Local env files are git-ignored; tolerate absence (then fail clearly below).
for (const file of [".env", ".env.local"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Falls through to the DATABASE_URL check in main().
  }
}

const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(320)
  .pipe(z.email())
  .transform((value) => value.toLowerCase());

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/** Reads a line without echoing (TTY only). Falls back to nothing — callers
 *  must supply secrets via environment when stdin is not interactive. */
async function askSecret(question: string): Promise<string> {
  const stdin = process.stdin;
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    fail("Password prompt needs an interactive terminal. Set ADMIN_PASSWORD instead (never commit it).");
  }
  process.stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  let out = "";
  await new Promise<void>((resolve) => {
    const onData = (chunk: Buffer) => {
      const ch = chunk.toString("utf8");
      if (ch === "\r" || ch === "\n") {
        stdin.off("data", onData);
        resolve();
      } else if (ch === "\u0003") {
        process.stdout.write("\n");
        process.exit(130);
      } else if (ch === "\u007f" || ch === "\b") {
        out = out.slice(0, -1);
      } else if (ch >= " ") {
        out += ch;
      }
    };
    stdin.on("data", onData);
  });
  stdin.setRawMode(false);
  stdin.pause();
  process.stdout.write("\n");
  return out;
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "";
  if (!connectionString) {
    fail("DATABASE_URL is not configured. Set it in .env.local (see .env.example).");
  }
  const useSsl = /(sslmode=require|sslmode=verify-full|ssl=true)/i.test(connectionString);
  const adapter = new PrismaPg({
    connectionString,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  return new PrismaClient({ adapter });
}

async function main(): Promise<void> {
  const interactive = process.stdin.isTTY === true;

  const rawEmail = process.env.ADMIN_EMAIL ?? (interactive ? await ask("Admin email: ") : "");
  const emailParsed = emailSchema.safeParse(rawEmail);
  if (!emailParsed.success) fail("Invalid email address.");
  const email = emailParsed.data;

  let rawName = process.env.ADMIN_NAME ?? (interactive ? await ask("Admin name (optional): ") : "");
  rawName = rawName.trim().slice(0, 120);
  const name = rawName === "" ? null : rawName;

  const password = process.env.ADMIN_PASSWORD ?? (interactive ? await askSecret("Admin password: ") : "");
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    fail(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`);
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    fail(`Password must be at most ${PASSWORD_MAX_LENGTH} characters long.`);
  }

  const prisma = createClient();
  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, isActive: true },
    });
    if (existing) {
      fail(
        `Refusing: ${email} already exists (role=${existing.role}). ` +
          "This command never elevates or modifies existing users.",
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, role: "ADMIN", isActive: true },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    console.log(`Admin created: ${user.email} (role=${user.role}, active=${user.isActive}).`);
    console.log("Sign in at /login. The Dashboard link appears for ADMIN sessions.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Admin creation failed.");
  process.exit(1);
});
