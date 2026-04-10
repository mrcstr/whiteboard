// @ts-nocheck
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

declare global {
  var cachedPrisma: PrismaClient | undefined;
}

const createClient = () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter } as any);
};

export const db = globalThis.cachedPrisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.cachedPrisma = db;
}