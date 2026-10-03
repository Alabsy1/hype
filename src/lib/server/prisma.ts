import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "";

  // Node-postgres (used under @prisma/adapter-pg) does not enable TLS from
  // `sslmode=` in the URL alone; mirror Neon default via explicit ssl option
  // when the configured URL requests it. Connections stay lazy until the first
  // query, so PrismaClient can be safely constructed before .env exists.
  const useSsl = /(sslmode=require|sslmode=verify-full|ssl=true)/i.test(
    connectionString,
  );

  const adapter = new PrismaPg({
    connectionString,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  return new PrismaClient({ adapter });
}

// Development-safe singleton: reuse the client across hot reloads.
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}