import { PrismaClient } from "@prisma/client";
export * from "@prisma/client";

declare global {
  // Prevent multiple Prisma instances in development
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

export const db: PrismaClient =
  globalThis.cachedPrisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.cachedPrisma = db;
}

export * from "@prisma/client";
