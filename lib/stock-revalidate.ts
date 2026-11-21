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
