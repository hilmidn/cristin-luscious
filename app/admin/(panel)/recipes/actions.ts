"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { deleteRecipeItem, saveRecipeItem } from "@/lib/inventory";
import type { RecipeItemInput } from "@/lib/inventory-types";

export type SimpleActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Sesi admin tidak valid. Silakan login ulang.");
  }
}

function revalidateRecipes() {
  revalidatePath("/admin");
  revalidatePath("/admin/recipes");
  revalidatePath("/admin/ingredients");
}

export async function saveRecipeItemAction(input: RecipeItemInput) {
  await requireAdmin();

  try {
    if (!input.ingredientId) {
      return { ok: false, error: "Pilih bahan terlebih dahulu." } as SimpleActionResult;
    }
    if (!Number.isFinite(input.qtyPerUnit) || input.qtyPerUnit <= 0) {
      return {
        ok: false,
        error: "Takaran per pcs harus lebih dari 0.",
      } as SimpleActionResult;
    }

    await saveRecipeItem(input);
    revalidateRecipes();

    return { ok: true } as SimpleActionResult;
  } catch (error) {
    console.error("saveRecipeItemAction", error);
    return { ok: false, error: "Gagal menyimpan resep." } as SimpleActionResult;
  }
}

export async function deleteRecipeItemAction(id: string) {
  await requireAdmin();

  try {
    await deleteRecipeItem(id);
    revalidateRecipes();

    return { ok: true } as SimpleActionResult;
  } catch (error) {
    console.error("deleteRecipeItemAction", error);
    return { ok: false, error: "Gagal menghapus baris resep." } as SimpleActionResult;
  }
}
