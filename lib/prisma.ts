import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Opsi transaksi interaktif untuk semua `prisma.$transaction(async (tx) => ...)`.
 *
 * Default Prisma (maxWait 2s, timeout 5s) terlalu ketat untuk Vercel + Neon:
 * satu transaksi bisa berisi puluhan round-trip ke DB, dan tiap round-trip
 * butuh 50-150 ms (lebih saat cold start). Tanpa opsi ini muncul error
 * "A commit cannot be executed on an expired transaction".
 *
 * `maxWait` = batas menunggu koneksi dari pool sebelum transaksi dimulai.
 * `timeout` = batas total durasi transaksi.
 *
 * Catatan: tetap utamakan memperkecil jumlah query di dalam transaksi —
 * timeout besar hanya jaring pengaman, bukan solusi utama.
 */
export const TX_OPTIONS = {
  maxWait: 10_000,
  timeout: 20_000,
} as const;

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
      adapter: new PrismaPg({
        connectionString,
        // Serverless: tiap instance punya pool sendiri. Batasi agar beberapa
        // instance yang jalan bersamaan tidak menghabiskan koneksi Neon.
        max: 5,
      }),
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
    });
  }

  return globalForPrisma.prisma;
}
