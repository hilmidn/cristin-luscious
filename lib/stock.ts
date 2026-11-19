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

/**
 * Kembalikan stok jadi yang sempat keluar untuk satu nota (order dibatalkan
 * atau dihapus). Sumber kebenarannya LEDGER, bukan katalog: net keluar =
 * sum(OUT) - sum(IN) dari movement yang tertaut ke item nota, sehingga
 * idempoten (setelah dikembalikan, net nol → tidak dobel).
 *
 * WAJIB dipanggil dalam transaksi pemanggil.
 */
export async function restoreOrderVariantStock(
  tx: Prisma.TransactionClient,
  orderId: string,
  orderCode?: string | null,
): Promise<void> {
  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: { id: true, variantId: true },
  });

  const itemIds = items.map((item) => item.id);

  if (itemIds.length === 0) {
    return;
  }

  const sums = await tx.variantStockMovement.groupBy({
    by: ["variantId", "type"],
    where: { orderItemId: { in: itemIds }, type: { in: ["OUT", "IN"] } },
    _sum: { qty: true },
  });

  const netByVariant = new Map<string, number>();

  for (const row of sums) {
    const signed =
      row.type === "OUT" ? (row._sum.qty ?? 0) : -(row._sum.qty ?? 0);
    netByVariant.set(
      row.variantId,
      (netByVariant.get(row.variantId) ?? 0) + signed,
    );
  }

  // Movement pengembalian tetap ditautkan ke satu item nota supaya
  // idempotensinya terjaga.
  const firstItemByVariant = new Map<string, string>();

  for (const item of items) {
    if (item.variantId && !firstItemByVariant.has(item.variantId)) {
      firstItemByVariant.set(item.variantId, item.id);
    }
  }

  for (const [variantId, net] of netByVariant) {
    if (net <= 0) {
      continue;
    }

    await recordStockMovement(tx, {
      variantId,
      type: "IN",
      qty: net,
      orderItemId: firstItemByVariant.get(variantId) ?? null,
      note: `Pengembalian stok — nota ${orderCode ?? orderId} batal/dihapus`,
    });
  }
}

/**
 * Stok varian yang boleh dipesan dari web: varian + produknya published.
 * Dipakai halaman /order (dipanggil per request — force-dynamic).
 */
export async function getPublishedVariantStockMap(): Promise<
  Record<string, number>
> {
  const prisma = getPrisma();

  const variants = await prisma.productVariant.findMany({
    where: { published: true, product: { published: true } },
    select: { id: true, stockQty: true },
  });

  return Object.fromEntries(variants.map((variant) => [variant.id, variant.stockQty]));
}
