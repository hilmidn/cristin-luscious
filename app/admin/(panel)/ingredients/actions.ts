"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import {
  adjustStock,
  createIngredient,
  createPurchaseNote,
  deleteIngredient,
  updateIngredient,
} from "@/lib/inventory";
import type {
  IngredientInput,
  PurchaseNoteInput,
} from "@/lib/inventory-types";

export type SimpleActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Sesi admin tidak valid. Silakan login ulang.");
  }
}

function revalidateInventory() {
  revalidatePath("/admin");
  revalidatePath("/admin/ingredients");
  revalidatePath("/admin/recipes");
}

export async function createIngredientAction(input: IngredientInput) {
  await requireAdmin();

  try {
    if (!input.name.trim()) {
      return { ok: false, error: "Nama bahan wajib diisi." } as SimpleActionResult;
    }
    if (!input.unit.trim()) {
      return { ok: false, error: "Satuan bahan wajib diisi." } as SimpleActionResult;
    }
    if (input.minStockQty < 0) {
      return { ok: false, error: "Ambang stok tidak boleh minus." } as SimpleActionResult;
    }

    const created = await createIngredient(input);
    revalidateInventory();

    return { ok: true, id: created.id } as SimpleActionResult & { id?: string };
  } catch (error) {
    console.error("createIngredientAction", error);
    return { ok: false, error: "Gagal menambah bahan." } as SimpleActionResult;
  }
}

export async function updateIngredientAction(id: string, input: IngredientInput) {
  await requireAdmin();

  try {
    if (!input.name.trim()) {
      return { ok: false, error: "Nama bahan wajib diisi." } as SimpleActionResult;
    }
    if (!input.unit.trim()) {
      return { ok: false, error: "Satuan bahan wajib diisi." } as SimpleActionResult;
    }
    if (input.minStockQty < 0) {
      return { ok: false, error: "Ambang stok tidak boleh minus." } as SimpleActionResult;
    }

    await updateIngredient(id, input);
    revalidateInventory();

    return { ok: true } as SimpleActionResult;
  } catch (error) {
    console.error("updateIngredientAction", error);
    return { ok: false, error: "Gagal mengubah bahan." } as SimpleActionResult;
  }
}

export async function deleteIngredientAction(id: string) {
  await requireAdmin();

  try {
    await deleteIngredient(id);
    revalidateInventory();

    return { ok: true } as SimpleActionResult;
  } catch (error) {
    console.error("deleteIngredientAction", error);
    return {
      ok: false,
      error: "Gagal menghapus bahan (masih dipakai di resep/pembelian?).",
    } as SimpleActionResult;
  }
}

export async function purchaseAction(input: PurchaseNoteInput) {
  await requireAdmin();

  try {
    const items = input.items.filter(
      (item) => Number.isFinite(item.qty) && item.qty > 0,
    );

    if (items.length === 0) {
      return {
        ok: false,
        error: "Minimal satu baris bahan dengan jumlah lebih dari 0.",
      } as SimpleActionResult;
    }

    for (const item of items) {
      if (!Number.isFinite(item.unitCost) || item.unitCost < 0) {
        return {
          ok: false,
          error: "Harga per unit tidak valid.",
        } as SimpleActionResult;
      }
    }

    await createPurchaseNote({
      supplier: input.supplier,
      note: input.note,
      purchasedAt: input.purchasedAt,
      items,
    });

    revalidateInventory();

    return { ok: true } as SimpleActionResult;
  } catch (error) {
    console.error("purchaseAction", error);
    return { ok: false, error: "Gagal mencatat nota pembelian." } as SimpleActionResult;
  }
}

export async function adjustStockAction(
  ingredientId: string,
  qty: number,
  note?: string,
) {
  await requireAdmin();

  try {
    if (!Number.isFinite(qty) || qty === 0) {
      return {
        ok: false,
        error: "Koreksi harus angka selain 0 (plus atau minus).",
      } as SimpleActionResult;
    }

    await adjustStock(ingredientId, qty, note);
    revalidateInventory();

    return { ok: true } as SimpleActionResult;
  } catch (error) {
    console.error("adjustStockAction", error);
    return { ok: false, error: "Gagal mengoreksi stok." } as SimpleActionResult;
  }
}
