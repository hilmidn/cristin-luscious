"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { applyProductionStage } from "@/lib/production-stage";
import type { ProductionStage } from "@/lib/production-types";

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
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/recap");
  revalidatePath("/admin/production");
  revalidatePath("/admin/ingredients");
  revalidatePath("/admin/recipes");
}

/**
 * Ubah tahap satu grup produk sekaligus. Semua varian produk pada tanggal
 * produksi yang sama selalu memakai tahap yang sama.
 *
 * Logika bisnis (transaksi, sinkron status nota, deduction bahan) ada di
 * `applyProductionStage` (lib/production-stage.ts) supaya bisa dipakai juga
 * endpoint API mobile.
 */
export async function setProductionProductStage(
  taskIds: string[],
  stage: ProductionStage,
): Promise<ProductionActionResult> {
  try {
    await requireAdmin();

    const result = await applyProductionStage(taskIds, stage);

    if (result.ok) {
      revalidateProduction();
    }

    return result;
  } catch (error) {
    console.error("setProductionProductStage", error);

    return { ok: false, error: "Gagal mengubah tahap produksi." };
  }
}
