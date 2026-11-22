-- AlterTable: waktu pesanan ditutup (masuk SELESAI / DIBATALKAN).
ALTER TABLE "orders" ADD COLUMN     "closedAt" TIMESTAMP(3);

-- Backfill: pesanan yang sudah tertutup memakai waktu update terakhir
-- (approx terbaik untuk data lama).
UPDATE "orders"
SET "closedAt" = "updatedAt"
WHERE "status" IN ('SELESAI', 'DIBATALKAN') AND "closedAt" IS NULL;
