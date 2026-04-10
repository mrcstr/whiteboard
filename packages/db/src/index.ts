import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

declare global {
  var cachedPrisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  // Use Neon serverless adapter in production (Vercel)
  if (process.env.VERCEL) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter } as any);
  }

  // Use standard client locally
  return new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  });
}

export const db: PrismaClient =
  globalThis.cachedPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.cachedPrisma = db;
}

export * from "@prisma/client";