"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import type { OrderStatus } from "@/lib/order-types";
import { getPrisma } from "@/lib/prisma";
import {
  PRODUCTION_STAGES,
  type ProductionStage,
} from "@/lib/production-types";

export type ProductionActionResult =
  | { ok: true }
  | { ok: false; error: string };

/** Status order yang boleh diubah otomatis oleh alur produksi. */
const AUTO_STATUSES: OrderStatus[] = ["BARU", "DIPROSES", "SELESAI_PRODUKSI"];

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Sesi admin tidak valid. Silakan login ulang.");
  }
}

function revalidateProduction() {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/recap");
  revalidatePath("/admin/production");
}

/**
 * Ubah tahap satu grup varian sekaligus. Semua item di grup (produk + varian
 * pada tanggal produksi yang sama) selalu memakai tahap yang sama.
 *
 * `startedAt` diisi saat grup pertama kali keluar dari antrian, `completedAt`
 * saat mencapai SIAP (dikosongkan lagi bila mundur).
 *
 * Status order ikut disesuaikan otomatis:
 * - semua item nota SIAP -> `SELESAI_PRODUKSI`
 * - keluar dari ANTRI -> `BARU` menjadi `DIPROSES`
 * - produksi dibuka lagi saat status `SELESAI_PRODUKSI` -> kembali `DIPROSES`
 */
export async function setProductionGroupStage(
  taskIds: string[],
  stage: ProductionStage,
): Promise<ProductionActionResult> {
  try {
    await requireAdmin();

    if (!PRODUCTION_STAGES.includes(stage)) {
      return { ok: false, error: "Tahap produksi tidak valid." };
    }

    if (!Array.isArray(taskIds)) {
      return { ok: false, error: "Grup produksi tidak valid." };
    }

    const ids = Array.from(
      new Set(
        taskIds.filter(
          (id): id is string => typeof id === "string" && id.length > 0,
        ),
      ),
    );

    if (ids.length === 0) {
      return { ok: false, error: "Grup produksi tidak memiliki item." };
    }

    const prisma = getPrisma();
    const existing = await prisma.productionTask.findMany({
      where: { id: { in: ids } },
      select: { id: true, orderId: true },
    });

    if (existing.length !== ids.length) {
      return {
        ok: false,
        error: "Sebagian item produksi sudah tidak tersedia. Muat ulang halaman.",
      };
    }

    const orderIds = Array.from(
      new Set(existing.map((task) => task.orderId)),
    );
    const now = new Date();
    const completedAt = stage === "SIAP" ? now : null;

    await prisma.$transaction(async (tx) => {
      if (stage === "ANTRI") {
        await tx.productionTask.updateMany({
          where: { id: { in: ids } },
          data: { stage, startedAt: null, completedAt },
        });
      } else {
        await tx.productionTask.updateMany({
          where: { id: { in: ids }, startedAt: null },
          data: { startedAt: now },
        });
        await tx.productionTask.updateMany({
          where: { id: { in: ids } },
          data: { stage, completedAt },
        });
      }

      // Sinkronkan status tiap nota yang tersentuh grup ini.
      const orders = await tx.order.findMany({
        where: { id: { in: orderIds }, status: { in: AUTO_STATUSES } },
        select: { id: true, status: true },
      });

      if (orders.length === 0) {
        return;
      }

      const tasks = await tx.productionTask.findMany({
        where: { orderId: { in: orderIds } },
        select: { orderId: true, stage: true },
      });

      const pendingByOrder = new Map<string, number>();

      for (const task of tasks) {
        if (task.stage !== "SIAP") {
          pendingByOrder.set(
            task.orderId,
            (pendingByOrder.get(task.orderId) ?? 0) + 1,
          );
        }
      }

      const toSelesaiProduksi: string[] = [];
      const toDiproses: string[] = [];

      for (const order of orders) {
        if ((pendingByOrder.get(order.id) ?? 0) === 0) {
          toSelesaiProduksi.push(order.id);
          continue;
        }

        if (
          order.status === "SELESAI_PRODUKSI" ||
          (order.status === "BARU" && stage !== "ANTRI")
        ) {
          toDiproses.push(order.id);
        }
      }

      if (toSelesaiProduksi.length > 0) {
        await tx.order.updateMany({
          where: {
            id: { in: toSelesaiProduksi },
            status: { in: AUTO_STATUSES },
          },
          data: { status: "SELESAI_PRODUKSI" },
        });
      }

      if (toDiproses.length > 0) {
        await tx.order.updateMany({
          where: {
            id: { in: toDiproses },
            status: { in: AUTO_STATUSES },
          },
          data: { status: "DIPROSES" },
        });
      }
    });

    revalidateProduction();

    return { ok: true };
  } catch (error) {
    console.error("setProductionGroupStage", error);

    return { ok: false, error: "Gagal mengubah tahap produksi." };
  }
}
