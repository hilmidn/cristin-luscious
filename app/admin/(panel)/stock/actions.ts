"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import {
  adjustVariantStock,
  getVariantMovements,
  restockVariant,
} from "@/lib/stock";
import { revalidateVariantStockCache } from "@/lib/stock-revalidate";
import type { StockMovementRow } from "@/lib/stock-types";

export type SimpleActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Sesi admin tidak valid. Silakan login ulang.");
  }
}

async function revalidateStock(variantIds: string[]) {
  revalidatePath("/admin/stock");
  revalidatePath("/admin");
  // Chip stok di halaman detail produk publik (ISR) ikut di-purge supaya
  // tidak perlu refresh 2x setelah restock/koreksi.
  await revalidateVariantStockCache(variantIds);
}

export async function restockAction(
  variantId: string,
  qty: number,
  note: string,
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Sesi admin tidak valid. Silakan login ulang." };
  }

  try {
    await restockVariant(variantId, qty, note || null);
    await revalidateStock([variantId]);
    return { ok: true };
  } catch (error) {
    console.error("restockAction", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal restock stok.",
    };
  }
}

export async function adjustStockAction(
  variantId: string,
  targetQty: number,
  note: string,
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Sesi admin tidak valid. Silakan login ulang." };
  }

  try {
    await adjustVariantStock(variantId, targetQty, note || null);
    await revalidateStock([variantId]);
    return { ok: true };
  } catch (error) {
    console.error("adjustStockAction", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal mengoreksi stok.",
    };
  }
}

export async function getMovementsAction(
  variantId: string,
): Promise<StockMovementRow[]> {
  await requireAdmin();

  return getVariantMovements(variantId, 50);
}
