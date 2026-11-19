"use server";

import { getPrisma } from "@/lib/prisma";
import { saveOrderCore } from "@/lib/order-save";
import type { OrderInput } from "@/lib/order-types";

export type WebOrderItem = {
  variantId: string;
  quantity: number;
};

export type WebOrderResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

/**
 * Order dari web publik: tanpa akun, pickup-only, pembayaran manual saat
 * ambil. Harga & validasi tetap di server (saveOrderCore) — client hanya
 * mengirim pilihan varian + jumlah.
 */
export async function submitWebOrder(input: {
  customerName: string;
  phone: string;
  note: string;
  scheduledAt: string;
  items: WebOrderItem[];
}): Promise<WebOrderResult> {
  // Produk yang dipesan wajib orderable — client bisa mengirim cart lama
  // yang menyimpan varian produk yang sudah disembunyikan dari web.
  const variantIds = [
    ...new Set(input.items.map((item) => item.variantId)),
  ];

  if (variantIds.length > 0) {
    const rows = await getPrisma().productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, product: { select: { orderable: true } } },
    });

    const orderableById = new Map(rows.map((row) => [row.id, row.product.orderable]));

    for (const variantId of variantIds) {
      if (orderableById.get(variantId) === false) {
        return {
          ok: false,
          error:
            "Ada produk di keranjang yang sedang tidak bisa dipesan online. Hapus itemnya lalu coba lagi.",
        };
      }
    }
  }

  const payload: OrderInput = {
    customerName: input.customerName,
    phone: input.phone,
    // Pickup-only: tanpa alamat (wajib hanya untuk ANTAR di saveOrderCore).
    address: "",
    serviceType: "PICKUP",
    scheduledAt: input.scheduledAt,
    deliveryPoint: null,
    deliveryMapUrl: null,
    source: "Website",
    note: input.note,
    shippingCost: 0,
    status: "BARU",
    items: input.items.map((item, index) => ({
      variantId: item.variantId,
      productId: null,
      productName: "",
      variantName: "",
      unitPrice: null,
      priceUnit: null,
      quantity: item.quantity,
      sortOrder: index,
    })),
  };

  const result = await saveOrderCore(payload);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, code: result.code };
}
