-- CreateEnum
CREATE TYPE "IngredientMovementType" AS ENUM ('PURCHASE', 'PRODUCTION_USE', 'MANUAL_ADJUST');

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "stockQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minStockQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_purchases" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unitCost" INTEGER NOT NULL DEFAULT 0,
    "totalCost" INTEGER NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "note" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_items" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "ingredientId" TEXT NOT NULL,
    "qtyPerUnit" DOUBLE PRECISION NOT NULL,
    "note" TEXT,

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_movements" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "type" "IngredientMovementType" NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "orderId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ingredient_purchases_ingredientId_purchasedAt_idx" ON "ingredient_purchases"("ingredientId", "purchasedAt");

-- CreateIndex
CREATE INDEX "recipe_items_productId_idx" ON "recipe_items"("productId");

-- CreateIndex
CREATE INDEX "recipe_items_variantId_idx" ON "recipe_items"("variantId");

-- CreateIndex
CREATE INDEX "recipe_items_ingredientId_idx" ON "recipe_items"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_items_productId_ingredientId_key" ON "recipe_items"("productId", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_items_variantId_ingredientId_key" ON "recipe_items"("variantId", "ingredientId");

-- CreateIndex
CREATE INDEX "ingredient_movements_ingredientId_createdAt_idx" ON "ingredient_movements"("ingredientId", "createdAt");

-- CreateIndex
CREATE INDEX "ingredient_movements_orderId_idx" ON "ingredient_movements"("orderId");

-- AddForeignKey
ALTER TABLE "ingredient_purchases" ADD CONSTRAINT "ingredient_purchases_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_movements" ADD CONSTRAINT "ingredient_movements_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_movements" ADD CONSTRAINT "ingredient_movements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

