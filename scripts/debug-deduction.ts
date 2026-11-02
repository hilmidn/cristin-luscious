/**
 * Diagnosa deduction bahan baku: mengapa stok tidak berkurang saat nota
 * SELESAI_PRODUKSI.
 *
 * Jalankan di mesin yang punya .env.local / .env dengan DATABASE_URL:
 *   npx tsx scripts/debug-deduction.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL tidak ditemukan di .env.local / .env");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
  log: ["error"],
});

async function main() {
  const orders = await prisma.order.findMany({
    where: { status: "SELESAI_PRODUKSI" },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      code: true,
      status: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          productName: true,
          variantName: true,
          productId: true,
          variantId: true,
          quantity: true,
        },
      },
    },
  });

  if (orders.length === 0) {
    console.log("Tidak ada nota berstatus SELESAI_PRODUKSI.");
    return;
  }

  for (const order of orders) {
    console.log("\n========================================");
    console.log(`NOTA ${order.code}  (SELESAI_PRODUKSI, update ${order.updatedAt.toISOString()})`);

    const productIds = [
      ...new Set(order.items.map((i) => i.productId).filter((v): v is string => Boolean(v))),
    ];
    const variantIds = [
      ...new Set(order.items.map((i) => i.variantId).filter((v): v is string => Boolean(v))),
    ];

    for (const item of order.items) {
      if (!item.productId && !item.variantId) {
        console.log(
          `  ⚠️  ITEM TANPA PRODUK/VARIAN (tidak bisa dihitung resepnya): ${item.productName} / ${item.variantName} x${item.quantity}`,
        );
      }
    }

    const [baseItems, toppingItems, movements] = await Promise.all([
      productIds.length
        ? prisma.recipeItem.findMany({
            where: { productId: { in: productIds } },
            include: { ingredient: true, product: true },
          })
        : Promise.resolve([]),
      variantIds.length
        ? prisma.recipeItem.findMany({
            where: { variantId: { in: variantIds } },
            include: { ingredient: true, variant: true },
          })
        : Promise.resolve([]),
      prisma.ingredientMovement.findMany({
        where: { orderId: order.id, type: "PRODUCTION_USE" },
        include: { ingredient: true },
      }),
    ]);

    console.log(
      `  Item pesanan: ${order.items
        .map((i) => `${i.productName}/${i.variantName} x${i.quantity}`)
        .join(" | ")}`,
    );
    console.log(
      `  Resep BASE  : ${baseItems.length} baris ${
        baseItems.length
          ? `(${baseItems
              .map(
                (b) =>
                  `${b.product?.name ?? "?"} ← ${b.ingredient.name} ${b.qtyPerUnit}${b.ingredient.unit}/pcs`,
              )
              .join(", ")})`
          : "⚠️  KOSONG — ini penyebab stok tidak terpotong untuk produk terkait"
      }`,
    );
    console.log(
      `  Resep TOPPING: ${toppingItems.length} baris ${
        toppingItems.length
          ? `(${toppingItems
              .map(
                (t) =>
                  `${t.variant?.name ?? "?"} ← ${t.ingredient.name} ${t.qtyPerUnit}${t.ingredient.unit}/pcs`,
              )
              .join(", ")})`
          : ""
      }`,
    );

    // Hitung kebutuhan (mirror computeOrderNeeds)
    const needs = new Map<string, { name: string; unit: string; qty: number }>();
    const baseByProduct = new Map<string, typeof baseItems>();
    for (const b of baseItems) {
      const list = baseByProduct.get(b.productId!) ?? [];
      list.push(b);
      baseByProduct.set(b.productId!, list);
    }
    const toppingByVariant = new Map<string, typeof toppingItems>();
    for (const t of toppingItems) {
      const list = toppingByVariant.get(t.variantId!) ?? [];
      list.push(t);
      toppingByVariant.set(t.variantId!, list);
    }
    for (const item of order.items) {
      const rows = [
        ...(item.productId ? (baseByProduct.get(item.productId) ?? []) : []),
        ...(item.variantId ? (toppingByVariant.get(item.variantId) ?? []) : []),
      ];
      for (const row of rows) {
        const need = row.qtyPerUnit * item.quantity;
        const prev = needs.get(row.ingredientId);
        needs.set(row.ingredientId, {
          name: row.ingredient.name,
          unit: row.ingredient.unit,
          qty: (prev?.qty ?? 0) + need,
        });
      }
    }

    if (needs.size === 0) {
      console.log("  ➡️  KEBUTUHAN BAHAN: KOSONG → tidak ada yang dipotong.");
    } else {
      console.log("  ➡️  Kebutuhan bahan (seharusnya terpotong):");
      for (const [, need] of needs) {
        const ing = await prisma.ingredient.findFirst({
          where: { name: need.name },
          select: { stockQty: true },
        });
        console.log(
          `     - ${need.name}: ${need.qty.toFixed(2)} ${need.unit} (stok saat ini: ${ing?.stockQty ?? "?"})`,
        );
      }
    }

    if (movements.length > 0) {
      console.log(
        `  Movement PRODUCTION_USE: ${movements.length} baris (${movements
          .map((m) => `${m.ingredient.name} ${m.qty}`)
          .join(", ")}) → nota ini SUDAH pernah dipotong (idempotent skip).`,
      );
    } else {
      console.log("  Movement PRODUCTION_USE: BELUM ADA → deduction belum pernah jalan untuk nota ini.");
    }
  }

  console.log("\n========================================");
  console.log("CATATAN:");
  console.log("- Resep BASE/TOPPING kosong → isi dulu di /admin/recipes.");
  console.log("- Movement belum ada + kebutuhan ada → nota selesai produksi SEBELUM fix deploy;");
  console.log("  buka satu task produksi nota itu (mundur), lalu SIAP-kan lagi untuk memicu deduction.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
