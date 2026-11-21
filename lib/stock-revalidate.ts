import "server-only";

import { revalidatePath } from "next/cache";
import { getPrisma } from "./prisma";

/**
 * Invalidate cache halaman publik yang menampilkan chip stok varian
 * (/products/[slug], ISR 60s). Tanpa ini, restock/adjust menyisakan chip
 * stok lama di halaman detail sampai ISR habis — kelihatan seperti
 * "harus refresh 2x" (refresh pertama masih serve cache lama).
 *
 * Konvensi repo: core logic (lib/stock.ts) tidak memanggil revalidatePath;
 * pemanggil (server actions / route handlers) yang memanggil helper ini,
 * SETELAH transaksi stok commit — bukan di dalamnya — supaya regenerasi
 * cache selalu membaca data yang sudah final.
 */
export async function revalidateVariantStockCache(
  variantIds: string[],
): Promise<void> {
  const ids = Array.from(new Set(variantIds.filter(Boolean)));

  if (ids.length === 0) {
    return;
  }

  const variants = await getPrisma().productVariant.findMany({
    where: { id: { in: ids } },
    select: { product: { select: { slug: true } } },
  });

  for (const variant of variants) {
    revalidatePath(`/products/${variant.product.slug}`);
  }
}

/**
 * VariantId yang tertaut ke item nota (untuk purge halaman detail publik).
 * WAJIB dipanggil SEBELUM nota dihapus — orderItem ikut cascade saat
 * order.delete, jadi setelahnya tidak ada yang bisa di-query.
 */
export async function getOrderVariantIds(orderId: string): Promise<string[]> {
  if (!orderId) {
    return [];
  }

  const items = await getPrisma().orderItem.findMany({
    where: { orderId },
    select: { variantId: true },
  });

  return items
    .map((item) => item.variantId)
    .filter((value): value is string => Boolean(value));
}

/**
 * Purge halaman detail publik untuk semua varian dalam satu nota
 * (order masuk mengurangi stok, pembatalan mengembalikannya). Nota harus
 * masih ada di DB saat fungsi ini dipanggil.
 */
export async function revalidateOrderVariantStockCache(
  orderId: string,
): Promise<void> {
  await revalidateVariantStockCache(await getOrderVariantIds(orderId));
}
