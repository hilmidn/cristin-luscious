import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "./prisma";
import type {
  StockMovementRow,
  StockMovementType,
  StockRow,
} from "./stock-types";

/**
 * Stok varian (barang jadi siap jual). Lapisan ini TERPISAH dari stok bahan
 * (lib/inventory.ts): bahan = produksi (mentah), varian = jualan (jadi).
 * Semua perubahan stok wajib lewat recordStockMovement supaya cached
 * stockQty dan ledger variant_stock_movements tidak pernah berbeda.
 */

export type StockMovementInput = {
  variantId: string;
  type: StockMovementType;
  // IN/OUT wajib positif; ADJUST boleh negatif (koreksi turun). Nol ditolak.
  qty: number;
  orderItemId?: string | null;
  note?: string | null;
};

/**
 * Satu pintu perubahan stok varian — WAJIB dipanggil dalam transaksi
 * pemanggil (tx) supaya ledger + cached stockQty konsisten dengan sisa
 * perubahan lain di transaksi yang sama.
 *
 * OUT memakai update bersyarat (stockQty >= qty) sebagai guard oversell:
 * dua order bersamaan hanya satu yang berhasil mengambil stok terakhir.
 */
export async function recordStockMovement(
  tx: Prisma.TransactionClient,
  input: StockMovementInput,
): Promise<void> {
  const { variantId, type, qty } = input;

  if (!Number.isInteger(qty) || qty === 0) {
    throw new Error("Jumlah stok harus bilangan bulat selain nol.");
  }

  if (type !== "ADJUST" && qty < 0) {
    throw new Error("Stok masuk/keluar harus bilangan positif.");
  }

  const delta = type === "OUT" ? -Math.abs(qty) : qty;

  if (delta < 0) {
    const updated = await tx.productVariant.updateMany({
      where: { id: variantId, stockQty: { gte: -delta } },
      data: { stockQty: { decrement: -delta } },
    });

    if (updated.count === 0) {
      throw new Error("Stok varian tidak cukup.");
    }
  } else {
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stockQty: { increment: delta } },
    });
  }

  await tx.variantStockMovement.create({
    data: {
      variantId,
      type,
      // Ledger: IN/OUT selalu positif (arah dari type), ADJUST menyimpan tanda.
      qty: type === "ADJUST" ? qty : Math.abs(qty),
      orderItemId: input.orderItemId ?? null,
      note: input.note ?? null,
    },
  });
}

/**
 * Ringkasan stok semua varian untuk admin (urut produk lalu varian).
 */
export async function getStockOverview(): Promise<StockRow[]> {
  const prisma = getPrisma();

  const variants = await prisma.productVariant.findMany({
    select: {
      id: true,
      name: true,
      stockQty: true,
      sortOrder: true,
      product: {
        select: {
          id: true,
          name: true,
          image: true,
          fulfillmentMode: true,
          sortOrder: true,
        },
      },
    },
    orderBy: [{ product: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  return variants.map((variant) => ({
    productId: variant.product.id,
    productName: variant.product.name,
    productImage: variant.product.image,
    fulfillmentMode: variant.product.fulfillmentMode,
    variantId: variant.id,
    variantName: variant.name,
    stockQty: variant.stockQty,
  }));
}

export async function restockVariant(
  variantId: string,
  qty: number,
  note?: string | null,
): Promise<void> {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error("Jumlah restock harus bilangan bulat positif.");
  }

  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    await recordStockMovement(tx, {
      variantId,
      type: "IN",
      qty,
      note: note ?? null,
    });
  });
}

/**
 * Koreksi stok ke nilai tertentu: dicatat sebagai satu movement ADJUST
 * (delta), bukan set langsung, agar riwayat tetap utuh.
 */
export async function adjustVariantStock(
  variantId: string,
  targetQty: number,
  note?: string | null,
): Promise<void> {
  if (!Number.isInteger(targetQty) || targetQty < 0) {
    throw new Error("Stok akhir harus bilangan bulat minimal 0.");
  }

  const prisma = getPrisma();

  await prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
      select: { stockQty: true },
    });

    if (!variant) {
      throw new Error("Varian tidak ditemukan.");
    }

    const delta = targetQty - variant.stockQty;

    if (delta === 0) {
      return;
    }

    await recordStockMovement(tx, {
      variantId,
      type: "ADJUST",
      qty: delta,
      note: note ?? null,
    });
  });
}

export async function getVariantMovements(
  variantId: string,
  limit = 50,
): Promise<StockMovementRow[]> {
  const prisma = getPrisma();

  const rows = await prisma.variantStockMovement.findMany({
    where: { variantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      qty: true,
      note: true,
      createdAt: true,
      orderItemId: true,
    },
  });

  // orderItemId disimpan tanpa FK (riwayat tidak ikut terhapus), jadi kode
  // order dicocokkan manual.
  const orderItemIds = rows
    .map((row) => row.orderItemId)
    .filter((value): value is string => Boolean(value));

  const orderItems = orderItemIds.length
    ? await prisma.orderItem.findMany({
        where: { id: { in: orderItemIds } },
        select: { id: true, order: { select: { code: true } } },
      })
    : [];

  const codeByOrderItemId = new Map(
    orderItems.map((item) => [item.id, item.order.code]),
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    // Signed untuk tampilan: keluar = minus.
    qty: row.type === "OUT" ? -row.qty : row.qty,
    note: row.note,
    orderCode: row.orderItemId
      ? (codeByOrderItemId.get(row.orderItemId) ?? null)
      : null,
    createdAt: row.createdAt.toISOString(),
  }));
}
