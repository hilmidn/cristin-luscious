import "server-only";

import { revalidatePath } from "next/cache";

import { ApiError } from "@/lib/api-auth";
import { deductIngredientsForOrder } from "@/lib/inventory";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-types";
import { getPrisma, TX_OPTIONS } from "@/lib/prisma";
import { restoreOrderVariantStock } from "@/lib/stock";

/**
 * Inti perubahan status pesanan — dipakai admin server action
 * (setOrderStatus) DAN endpoint mobile PATCH /api/v1/orders/:code/status.
 * Auth & pemetaan error ditangani pemanggil; aturan bisnis di sini:
 * - batal = final (tidak bisa dibuka lagi — ledger stok sudah dikembalikan)
 * - masuk SELESAI_PRODUKSI/SELESAI → potong bahan (delta, idempoten)
 * - batal → kembalikan stok jadi yang sempat keluar (kecuali sudah SELESAI)
 */
export async function changeOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ id: string; status: OrderStatus }> {
  if (!ORDER_STATUSES.includes(status)) {
    throw new ApiError(422, "Status tidak valid.");
  }

  await getPrisma().$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: orderId },
      select: { code: true, status: true },
    });

    if (!current) {
      throw new ApiError(404, "Pesanan tidak ditemukan.");
    }

    // Batal = final: stok jadi sudah dikembalikan saat pembatalan; membuka
    // lagi membuat ledger stok tidak cocok dengan item.
    if (current.status === "DIBATALKAN" && status !== "DIBATALKAN") {
      throw new ApiError(
        422,
        "Pesanan yang sudah dibatalkan tidak bisa diubah statusnya. Buat pesanan baru bila keliru.",
      );
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status },
      select: { id: true },
    });

    // Masuk SELESAI_PRODUKSI (atau lompat langsung ke SELESAI) memotong stok
    // bahan dengan guard delta yang sama seperti jalur produksi. Order web
    // masuk sebagai BARU — inilah titik konfirmasi manual admin/app yang
    // baru membuat bahan benar-benar keluar gudang.
    if (status === "SELESAI_PRODUKSI" || status === "SELESAI") {
      await deductIngredientsForOrder(tx, orderId);
    }

    // Pembatalan: barang jadi yang sempat keluar dari stok dikembalikan —
    // kecuali sudah SELESAI (fisiknya sudah diambil pelanggan).
    if (
      status === "DIBATALKAN" &&
      current.status !== "SELESAI" &&
      current.status !== "DIBATALKAN"
    ) {
      await restoreOrderVariantStock(tx, orderId, current.code);
    }
  }, TX_OPTIONS);

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/production");
  revalidatePath(`/admin/orders/${orderId}`);

  return { id: orderId, status };
}
