import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Lazily create the Prisma client so importing this module never throws
 * during `next build` when DATABASE_URL is unavailable (e.g. CI).
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL belum diset. Isi connection string Neon di .env.local.",
      );
    }

    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
    });
  }

  return globalForPrisma.prisma;
}
