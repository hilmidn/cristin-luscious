-- CreateEnum
CREATE TYPE "FulfillmentMode" AS ENUM ('PRE_ORDER', 'READY');

-- CreateEnum
CREATE TYPE "VariantStockMovementType" AS ENUM ('IN', 'OUT', 'ADJUST');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "fulfillmentMode" "FulfillmentMode" NOT NULL DEFAULT 'PRE_ORDER';

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "stockQty" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "variant_stock_movements" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "type" "VariantStockMovementType" NOT NULL,
    "qty" INTEGER NOT NULL,
    "orderItemId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variant_stock_movements_variantId_createdAt_idx" ON "variant_stock_movements"("variantId", "createdAt");

-- CreateIndex
CREATE INDEX "variant_stock_movements_orderItemId_idx" ON "variant_stock_movements"("orderItemId");

-- AddForeignKey
ALTER TABLE "variant_stock_movements" ADD CONSTRAINT "variant_stock_movements_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

