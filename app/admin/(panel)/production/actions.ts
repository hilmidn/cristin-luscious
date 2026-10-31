"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  nextStage,
  previousStage,
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
 * Simpan tahap baru. `startedAt` diisi saat item pertama kali keluar dari
 * antrian, `completedAt` saat mencapai SIAP (dikosongkan lagi bila mundur).
 */
async function applyStage(taskId: string, stage: ProductionStage) {
  await requireAdmin();

  const task = await getPrisma().productionTask.findUnique({
    where: { id: taskId },
    select: { id: true, stage: true, startedAt: true },
  });

  if (!task) {
    return { ok: false as const, error: "Item produksi tidak ditemukan." };
  }

  const now = new Date();

  await getPrisma().productionTask.update({
    where: { id: taskId },
    data: {
      stage,
      startedAt:
        stage === "ANTRI" ? null : (task.startedAt ?? now),
      completedAt: stage === "SIAP" ? now : null,
    },
    select: { id: true },
  });

  revalidateProduction();

  return { ok: true as const };
}

export async function setProductionStage(
  taskId: string,
  stage: ProductionStage,
): Promise<ProductionActionResult> {
  try {
    if (!PRODUCTION_STAGES.includes(stage)) {
      return { ok: false, error: "Tahap produksi tidak valid." };
    }

    return await applyStage(taskId, stage);
  } catch (error) {
    console.error("setProductionStage", error);

    return { ok: false, error: "Gagal mengubah tahap produksi." };
  }
}

/** Tombol "Lanjut" / "Kembali" di panel hari. */
export async function moveProductionStage(
  taskId: string,
  direction: "next" | "prev",
): Promise<ProductionActionResult> {
  try {
    await requireAdmin();

    const task = await getPrisma().productionTask.findUnique({
      where: { id: taskId },
      select: { stage: true },
    });

    if (!task) {
      return { ok: false, error: "Item produksi tidak ditemukan." };
    }

    const target =
      direction === "next"
        ? nextStage(task.stage)
        : previousStage(task.stage);

    if (!target) {
      return {
        ok: false,
        error: "Tahap sudah di batas awal / akhir.",
      };
    }

    return await applyStage(taskId, target);
  } catch (error) {
    console.error("moveProductionStage", error);

    return { ok: false, error: "Gagal mengubah tahap produksi." };
  }
}
