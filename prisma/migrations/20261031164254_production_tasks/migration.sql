-- CreateEnum
CREATE TYPE "ProductionStage" AS ENUM ('ANTRI', 'DISIAPKAN', 'DIPRODUKSI', 'DIKEMAS', 'SIAP');

-- CreateTable
CREATE TABLE "production_tasks" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "scheduledAt" DATE NOT NULL,
    "stage" "ProductionStage" NOT NULL DEFAULT 'ANTRI',
    "note" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_tasks_orderItemId_key" ON "production_tasks"("orderItemId");

-- CreateIndex
CREATE INDEX "production_tasks_scheduledAt_stage_idx" ON "production_tasks"("scheduledAt", "stage");

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_tasks" ADD CONSTRAINT "production_tasks_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
