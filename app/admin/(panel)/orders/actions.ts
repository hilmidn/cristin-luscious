"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { deductIngredientsForOrder } from "@/lib/inventory";
import { saveOrderCore, type SaveOrderResult } from "@/lib/order-save";
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
      select: { id: true },
    });

    if (!order) {
      return { ok: false, error: "Pesanan tidak ditemukan." };
    }

    await getPrisma().order.delete({ where: { id } });
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
    }, TX_OPTIONS);

    revalidateOrders(id);

    return { ok: true };
  } catch (error) {
    console.error("setOrderStatus", error);
    return { ok: false, error: "Gagal mengubah status pesanan." };
  }
}
