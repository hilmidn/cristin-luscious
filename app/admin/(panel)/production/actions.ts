"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  PRODUCTION_STAGES,
  type ProductionStage,
} from "@/lib/production-types";

export type ProductionActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Sesi admin tidak valid. Silakan login ulang.");
  }
}

function revalidateProduction() {
  revalidatePath("/admin");
  revalidatePath("/admin/production");
}

/**
 * Ubah tahap satu grup varian sekaligus. Semua item di grup (produk + varian
 * pada tanggal produksi yang sama) selalu memakai tahap yang sama.
 *
 * `startedAt` diisi saat grup pertama kali keluar dari antrian, `completedAt`
 * saat mencapai SIAP (dikosongkan lagi bila mundur).
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
      select: { id: true },
    });

    if (existing.length !== ids.length) {
      return {
        ok: false,
        error: "Sebagian item produksi sudah tidak tersedia. Muat ulang halaman.",
      };
    }

    const now = new Date();
    const completedAt = stage === "SIAP" ? now : null;

    if (stage === "ANTRI") {
      await prisma.productionTask.updateMany({
        where: { id: { in: ids } },
        data: { stage, startedAt: null, completedAt },
      });
    } else {
      await prisma.$transaction([
        prisma.productionTask.updateMany({
          where: { id: { in: ids }, startedAt: null },
          data: { startedAt: now },
        }),
        prisma.productionTask.updateMany({
          where: { id: { in: ids } },
          data: { stage, completedAt },
        }),
      ]);
    }

    revalidateProduction();

    return { ok: true };
  } catch (error) {
    console.error("setProductionGroupStage", error);

    return { ok: false, error: "Gagal mengubah tahap produksi." };
  }
}
