"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { deductIngredientsForOrder } from "@/lib/inventory";
import { saveOrderCore, type SaveOrderResult } from "@/lib/order-save";
import { restoreOrderVariantStock } from "@/lib/stock";
import {
  ORDER_STATUSES,
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

  const result = await saveOrderCore(input);

  if (result.ok) {
    revalidateOrders(result.id);
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

    await getPrisma().$transaction(async (tx) => {
      // Stok jadi yang sempat keluar dikembalikan dulu — kecuali sudah
      // SELESAI (barang fisiknya sudah diambil) atau memang sudah dibatal.
      if (order.status !== "SELESAI" && order.status !== "DIBATALKAN") {
        await restoreOrderVariantStock(tx, order.id, order.code);
      }

      await tx.order.delete({ where: { id } });
    }, TX_OPTIONS);

    revalidateOrders();

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

    if (!ORDER_STATUSES.includes(status)) {
      return { ok: false, error: "Status tidak valid." };
    }

    await getPrisma().$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        select: { code: true, status: true },
      });

      if (!current) {
        throw new Error("Pesanan tidak ditemukan.");
      }

      // Batal = final: stok jadi sudah dikembalikan saat pembatalan; membuka
      // lagi membuat ledger stok tidak cocok dengan item.
      if (current.status === "DIBATALKAN" && status !== "DIBATALKAN") {
        throw new Error(
          "Pesanan yang sudah dibatalkan tidak bisa diubah statusnya. Buat pesanan baru bila keliru.",
        );
      }

      await tx.order.update({
        where: { id },
        data: { status },
        select: { id: true },
      });

      // Override manual ke SELESAI_PRODUKSI (atau lompat langsung ke SELESAI)
      // juga memotong stok bahan, dengan guard delta yang sama seperti
      // jalur produksi.
      if (status === "SELESAI_PRODUKSI" || status === "SELESAI") {
        await deductIngredientsForOrder(tx, id);
      }

      // Pembatalan: barang jadi yang sempat keluar dari stok dikembalikan —
      // kecuali sudah SELESAI (fisiknya sudah diambil pelanggan).
      if (
        status === "DIBATALKAN" &&
        current.status !== "SELESAI" &&
        current.status !== "DIBATALKAN"
      ) {
        await restoreOrderVariantStock(tx, id, current.code);
      }
    }, TX_OPTIONS);

    revalidateOrders(id);

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
