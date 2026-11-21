-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('STOCK', 'PRE_ORDER');

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "fulfillmentType" "FulfillmentType";


-- Backfill Batch 1 (plan 2026-11-21-dynamic-stock-preorder):
-- klasifikasi item lama dari bukti yang tersedia.
--   PRE_ORDER : punya ProductionTask (item masuk kalender produksi)
--   STOCK     : punya VariantStockMovement type OUT (stok jadi keluar untuk item)
-- Bila keduanya ada (item pernah diedit klasifikasinya), yang TERAKHIR menang.
-- Movement type IN (pengembalian batal/hapus) tidak dihitung sebagai bukti
-- pemenuhan stok. Baris tanpa bukti dibiarkan NULL -> ditinjau manual
-- (ringkasan & daftarnya: npx tsx scripts/audit-fulfillment.ts).
UPDATE "order_items" AS oi
SET "fulfillmentType" = v."fulfillmentType"
FROM (
  SELECT
    oi2.id,
    CASE
      WHEN COALESCE(tmax, '-infinity'::timestamptz) >= COALESCE(smax, '-infinity'::timestamptz)
        THEN 'PRE_ORDER'::"FulfillmentType"
      ELSE 'STOCK'::"FulfillmentType"
    END AS "fulfillmentType"
  FROM "order_items" AS oi2
  LEFT JOIN LATERAL (
    SELECT MAX(pt."createdAt") AS tmax
    FROM "production_tasks" pt
    WHERE pt."orderItemId" = oi2.id
  ) t ON TRUE
  LEFT JOIN LATERAL (
    SELECT MAX(vsm."createdAt") AS smax
    FROM "variant_stock_movements" vsm
    WHERE vsm."orderItemId" = oi2.id AND vsm."type" = 'OUT'
  ) s ON TRUE
  WHERE tmax IS NOT NULL OR smax IS NOT NULL
) AS v
WHERE oi.id = v.id AND oi."fulfillmentType" IS NULL;
