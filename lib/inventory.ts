import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "./prisma";
import type {
  IngredientInput,
  IngredientRow,
  PurchaseInput,
  RecipeItemInput,
  RecipeProductNode,
  RecipeRow,
} from "./inventory-types";

export type OrderNeedItem = {
  productId: string | null;
  variantId: string | null;
  quantity: number;
};

/**
 * Daftar bahan + stok terkini + ambang alert + riwayat pembelian terakhir.
 */
export async function getIngredients(): Promise<IngredientRow[]> {
  const prisma = getPrisma();

  const [ingredients, totals] = await Promise.all([
    prisma.ingredient.findMany({
      orderBy: { name: "asc" },
      include: {
        purchases: {
          orderBy: { purchasedAt: "desc" },
          take: 5,
        },
      },
    }),
    prisma.ingredientPurchase.groupBy({
      by: ["ingredientId"],
      _sum: { qty: true },
    }),
  ]);

  const totalByIngredient = new Map(
    totals.map((t) => [t.ingredientId, t._sum.qty ?? 0]),
  );

  return ingredients.map((ing) => ({
    id: ing.id,
    name: ing.name,
    unit: ing.unit,
    stockQty: ing.stockQty,
    minStockQty: ing.minStockQty,
    isLow: ing.stockQty <= ing.minStockQty,
    totalPurchased: totalByIngredient.get(ing.id) ?? 0,
    note: ing.note,
    recentPurchases: ing.purchases.map((p) => ({
      id: p.id,
      qty: p.qty,
      unitCost: p.unitCost,
      totalCost: p.totalCost,
      supplier: p.supplier,
      purchasedAt: p.purchasedAt,
    })),
  }));
}

export async function createIngredient(input: IngredientInput) {
  const prisma = getPrisma();
  return prisma.ingredient.create({
    data: {
      name: input.name.trim(),
      unit: input.unit.trim(),
      minStockQty: input.minStockQty,
      note: input.note?.trim() || null,
    },
  });
}

export async function updateIngredient(id: string, input: IngredientInput) {
  const prisma = getPrisma();
  return prisma.ingredient.update({
    where: { id },
    data: {
      name: input.name.trim(),
      unit: input.unit.trim(),
      minStockQty: input.minStockQty,
      note: input.note?.trim() || null,
    },
  });
}

export async function deleteIngredient(id: string) {
  const prisma = getPrisma();
  return prisma.ingredient.delete({ where: { id } });
}

/**
 * Catat pembelian bahan: stock-in + jurnal movement PURCHASE (atomic).
 */
export async function createPurchase(input: PurchaseInput) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.ingredientPurchase.create({
      data: {
        ingredientId: input.ingredientId,
        qty: input.qty,
        unitCost: input.unitCost,
        totalCost: Math.round(input.qty * input.unitCost),
        supplier: input.supplier?.trim() || null,
        note: input.note?.trim() || null,
      },
    });

    await tx.ingredient.update({
      where: { id: input.ingredientId },
      data: { stockQty: { increment: input.qty } },
    });

    await tx.ingredientMovement.create({
      data: {
        ingredientId: input.ingredientId,
        type: "PURCHASE",
        qty: input.qty,
        note: input.supplier?.trim()
          ? `Pembelian dari ${input.supplier.trim()}`
          : "Pembelian bahan",
      },
    });

    return purchase;
  });
}

/**
 * Koreksi stok manual (bisa + atau -), tercatat di movement MANUAL_ADJUST.
 */
export async function adjustStock(
  ingredientId: string,
  qty: number,
  note?: string,
) {
  const prisma = getPrisma();

  return prisma.$transaction(async (tx) => {
    await tx.ingredient.update({
      where: { id: ingredientId },
      data: { stockQty: { increment: qty } },
    });

    await tx.ingredientMovement.create({
      data: {
        ingredientId,
        type: "MANUAL_ADJUST",
        qty,
        note: note?.trim() || "Koreksi stok manual",
      },
    });
  });
}

/**
 * Matriks resep untuk UI: base recipe per produk + topping per varian.
 */
export async function getRecipeMatrix(): Promise<RecipeProductNode[]> {
  const prisma = getPrisma();

  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      variants: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          recipeItems: {
            include: { ingredient: true },
          },
        },
      },
      recipeItems: {
        include: { ingredient: true },
      },
    },
  });

  return products.map((product) => {
    const base: RecipeRow[] = product.recipeItems.map((item) => ({
      id: item.id,
      ingredientId: item.ingredientId,
      ingredientName: item.ingredient.name,
      unit: item.ingredient.unit,
      qtyPerUnit: item.qtyPerUnit,
    }));

    const variants = product.variants.map((variant) => ({
      variantId: variant.id,
      variantName: variant.name,
      topping: variant.recipeItems.map((item) => ({
        id: item.id,
        ingredientId: item.ingredientId,
        ingredientName: item.ingredient.name,
        unit: item.ingredient.unit,
        qtyPerUnit: item.qtyPerUnit,
      })),
    }));

    return {
      productId: product.id,
      productName: product.name,
      base,
      variants,
    };
  });
}

/**
 * Simpan baris resep. Idempotent per (product/variant + ingredient):
 * sudah ada -> update qtyPerUnit; belum -> create.
 * Harus salah satu productId (BASE) atau variantId (TOPPING).
 */
export async function saveRecipeItem(input: RecipeItemInput) {
  const prisma = getPrisma();

  if (Boolean(input.productId) === Boolean(input.variantId)) {
    throw new Error(
      "Resep harus untuk produk (base) atau varian (topping), bukan keduanya/dua-duanya kosong.",
    );
  }

  const where = input.productId
    ? { productId_ingredientId: { productId: input.productId, ingredientId: input.ingredientId } }
    : { variantId_ingredientId: { variantId: input.variantId!, ingredientId: input.ingredientId } };

  await prisma.recipeItem.upsert({
    where,
    update: { qtyPerUnit: input.qtyPerUnit },
    create: {
      productId: input.productId ?? null,
      variantId: input.variantId ?? null,
      ingredientId: input.ingredientId,
      qtyPerUnit: input.qtyPerUnit,
    },
  });
}

export async function deleteRecipeItem(id: string) {
  const prisma = getPrisma();
  await prisma.recipeItem.delete({ where: { id } });
}

/**
 * Hitung total kebutuhan bahan untuk sekumpulan item pesanan.
 * Base recipe (per productId) + topping recipe (per variantId),
 * dikali quantity per pcs, lalu di-group per ingredient.
 */
export async function computeOrderNeeds(
  items: OrderNeedItem[],
  tx?: Prisma.TransactionClient,
): Promise<Map<string, number>> {
  const db = tx ?? getPrisma();

  const productIds = [
    ...new Set(items.map((i) => i.productId).filter((v): v is string => Boolean(v))),
  ];
  const variantIds = [
    ...new Set(items.map((i) => i.variantId).filter((v): v is string => Boolean(v))),
  ];

  const [baseItems, toppingItems] = await Promise.all([
    productIds.length
      ? db.recipeItem.findMany({
          where: { productId: { in: productIds } },
          select: { productId: true, ingredientId: true, qtyPerUnit: true },
        })
      : Promise.resolve([]),
    variantIds.length
      ? db.recipeItem.findMany({
          where: { variantId: { in: variantIds } },
          select: { variantId: true, ingredientId: true, qtyPerUnit: true },
        })
      : Promise.resolve([]),
  ]);

  const baseByProduct = new Map<string, { ingredientId: string; qtyPerUnit: number }[]>();
  for (const item of baseItems) {
    const list = baseByProduct.get(item.productId!) ?? [];
    list.push({ ingredientId: item.ingredientId, qtyPerUnit: item.qtyPerUnit });
    baseByProduct.set(item.productId!, list);
  }

  const toppingByVariant = new Map<string, { ingredientId: string; qtyPerUnit: number }[]>();
  for (const item of toppingItems) {
    const list = toppingByVariant.get(item.variantId!) ?? [];
    list.push({ ingredientId: item.ingredientId, qtyPerUnit: item.qtyPerUnit });
    toppingByVariant.set(item.variantId!, list);
  }

  const needs = new Map<string, number>();

  for (const item of items) {
    const recipeRows = [
      ...(item.productId ? (baseByProduct.get(item.productId) ?? []) : []),
      ...(item.variantId ? (toppingByVariant.get(item.variantId) ?? []) : []),
    ];

    for (const row of recipeRows) {
      const need = row.qtyPerUnit * item.quantity;
      needs.set(row.ingredientId, (needs.get(row.ingredientId) ?? 0) + need);
    }
  }

  return needs;
}

/**
 * Potong stok bahan untuk satu nota yang mencapai SELESAI_PRODUKSI.
 * WAJIB dipanggil dalam transaksi yang sama dengan perubahan status order.
 *
 * Idempotent: bila nota ini sudah pernah dipotong (ada movement
 * PRODUCTION_USE dengan orderId sama), fungsi skip — aman saat produksi
 * dibuka ulang lalu selesai lagi.
 */
export async function deductIngredientsForOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<{ skipped: boolean; deductedCount: number }> {
  const alreadyUsed = await tx.ingredientMovement.findFirst({
    where: { orderId, type: "PRODUCTION_USE" },
    select: { id: true },
  });

  if (alreadyUsed) {
    return { skipped: true, deductedCount: 0 };
  }

  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      code: true,
      items: {
        select: { productId: true, variantId: true, quantity: true },
      },
    },
  });

  if (!order) {
    return { skipped: true, deductedCount: 0 };
  }

  const needs = await computeOrderNeeds(
    order.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    })),
    tx,
  );

  let deductedCount = 0;

  for (const [ingredientId, qty] of needs) {
    await tx.ingredient.update({
      where: { id: ingredientId },
      data: { stockQty: { decrement: qty } },
    });

    await tx.ingredientMovement.create({
      data: {
        ingredientId,
        type: "PRODUCTION_USE",
        qty: -qty,
        orderId,
        note: `Produksi nota ${order.code}`,
      },
    });

    deductedCount += 1;
  }

  return { skipped: false, deductedCount };
}
