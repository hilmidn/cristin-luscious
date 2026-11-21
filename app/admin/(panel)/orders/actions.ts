"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { changeOrderStatus } from "@/lib/order-status";
import { saveOrderCore, type SaveOrderResult } from "@/lib/order-save";
import { restoreOrderVariantStock } from "@/lib/stock";
import {
  getOrderVariantIds,
  revalidateOrderVariantStockCache,
  revalidateVariantStockCache,
} from "@/lib/stock-revalidate";
import {
  type OrderInput,
  type OrderStatus,
} from "@/lib/order-types";
import { getPrisma, TX_OPTIONS } from "@/lib/prisma";

export type { SaveOrderResult };

export type SimpleActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Sesi admin tidak valid. Silakan login ulang.");
  }
}

function revalidateOrders(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/production");

  if (id) {
    revalidatePath(`/admin/orders/${id}`);
  }
}

/**
 * Wrapper admin untuk inti simpan pesanan. Logika bisnis (validasi, kode
 * invoice, item, task produksi) ada di `saveOrderCore` (lib/order-save.ts)
 * supaya bisa dipakai juga endpoint API mobile.
 */
export async function saveOrder(input: OrderInput): Promise<SaveOrderResult> {
  try {
    await requireAdmin();
  } catch (error) {
    console.error("saveOrder", error);
    return { ok: false, error: "Sesi admin tidak valid. Silakan login ulang." };
  }

  const result = await saveOrderCore(input, "ADMIN");

  if (result.ok) {
    revalidateOrders(result.id);
    // Stok jadi bisa berkurang di sini (item stock-backed) — chip stok di
    // halaman detail publik ikut di-purge.
    await revalidateOrderVariantStockCache(result.id);
  }

  return result;
}

export async function deleteOrder(id: string): Promise<SimpleActionResult> {
  try {
    await requireAdmin();

    const order = await getPrisma().order.findUnique({
      where: { id },
      select: { id: true, code: true, status: true },
    });

    if (!order) {
      return { ok: false, error: "Pesanan tidak ditemukan." };
    }

    // VariantId dikumpulkan SEBELUM delete — orderItem ter-cascade bersama nota.
    const variantIds = await getOrderVariantIds(order.id);

    await getPrisma().$transaction(async (tx) => {
      // Stok jadi yang sempat keluar dikembalikan dulu — kecuali sudah
      // SELESAI (barang fisiknya sudah diambil) atau memang sudah dibatal.
      if (order.status !== "SELESAI" && order.status !== "DIBATALKAN") {
        await restoreOrderVariantStock(tx, order.id, order.code);
      }

      await tx.order.delete({ where: { id } });
    }, TX_OPTIONS);

    revalidateOrders();
    await revalidateVariantStockCache(variantIds);

    return { ok: true };
  } catch (error) {
    console.error("deleteOrder", error);
    return { ok: false, error: "Gagal menghapus pesanan." };
  }
}

export async function setOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Sesi admin tidak valid. Silakan login ulang." };
  }

  try {
    // Aturan bisnis (deduct bahan, restore stok, guard batal-final,
    // revalidate) ada di lib/order-status.ts — dipakai juga endpoint mobile.
    await changeOrderStatus(id, status);
    return { ok: true };
  } catch (error) {
    console.error("setOrderStatus", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengubah status pesanan.",
    };
  }
}
