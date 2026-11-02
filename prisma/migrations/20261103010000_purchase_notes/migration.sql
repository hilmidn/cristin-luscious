-- DropForeignKey
ALTER TABLE "ingredient_purchases" DROP CONSTRAINT "ingredient_purchases_ingredientId_fkey";

-- DropTable
DROP TABLE "ingredient_purchases";

-- CreateTable
CREATE TABLE "purchase_notes" (
    "id" TEXT NOT NULL,
    "supplier" TEXT,
    "note" TEXT,
    "totalCost" INTEGER NOT NULL DEFAULT 0,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" TEXT NOT NULL,
    "purchaseNoteId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unitCost" INTEGER NOT NULL DEFAULT 0,
    "totalCost" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchase_notes_purchasedAt_idx" ON "purchase_notes"("purchasedAt");

-- CreateIndex
CREATE INDEX "purchase_items_purchaseNoteId_idx" ON "purchase_items"("purchaseNoteId");

-- CreateIndex
CREATE INDEX "purchase_items_ingredientId_idx" ON "purchase_items"("ingredientId");

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchaseNoteId_fkey" FOREIGN KEY ("purchaseNoteId") REFERENCES "purchase_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

