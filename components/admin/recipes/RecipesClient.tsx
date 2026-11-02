"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { IngredientRow, RecipeProductNode, RecipeRow } from "@/lib/inventory-types";
import {
  deleteRecipeItemAction,
  saveRecipeItemAction,
} from "@/app/admin/(panel)/recipes/actions";
import {
  ChevronDown,
  ChevronRight,
  Cookie,
  Layers,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type AddFormState = {
  sectionKey: string; // "base:<productId>" | "topping:<variantId>"
  ingredientId: string;
  qtyPerUnit: string;
} | null;

function RecipeRows({
  rows,
  unitLabel,
  onDelete,
  isPending,
}: {
  rows: RecipeRow[];
  unitLabel?: string;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-3 text-xs italic text-stone-400">
        Belum ada bahan di resep ini.
        {unitLabel ? ` ${unitLabel}` : ""}
      </p>
    );
  }

  return (
    <div className="divide-y divide-stone-100">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2">
            <Cookie className="h-3.5 w-3.5 text-stone-300" />
            <span className="font-medium text-stone-800">{row.ingredientName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-amber-700">
              {row.qtyPerUnit.toLocaleString("id-ID")} {row.unit}
              <span className="ml-1 font-normal text-stone-400">/ pcs</span>
            </span>
            <button
              onClick={() => onDelete(row.id)}
              disabled={isPending}
              className="rounded-lg border border-red-100 bg-white p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
              title="Hapus dari resep"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecipesClient({
  products,
  ingredients,
}: {
  products: RecipeProductNode[];
  ingredients: IngredientRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addForm, setAddForm] = useState<AddFormState>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeleteRow = (id: string) => {
    if (!window.confirm("Hapus baris resep ini?")) return;

    startTransition(async () => {
      const result = await deleteRecipeItemAction(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleSaveRow = () => {
    if (!addForm) return;

    const [kind, targetId] = addForm.sectionKey.split(":");
    const payload = {
      productId: kind === "base" ? targetId : undefined,
      variantId: kind === "topping" ? targetId : undefined,
      ingredientId: addForm.ingredientId,
      qtyPerUnit: Number(addForm.qtyPerUnit) || 0,
    };

    setError(null);

    startTransition(async () => {
      const result = await saveRecipeItemAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAddForm(null);
      router.refresh();
    });
  };

  if (ingredients.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Tambahkan bahan baku terlebih dahulu di halaman{" "}
        <a href="/admin/ingredients" className="font-bold underline">
          Bahan Baku
        </a>
        , lalu susun resep di sini.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {products.length === 0 ? (
        <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
          Belum ada produk di katalog.
        </p>
      ) : (
        products.map((product) => {
          const isOpen = expanded[product.productId] ?? false;
          const sectionKeyBase = `base:${product.productId}`;

          return (
            <div
              key={product.productId}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs"
            >
              {/* Product header */}
              <button
                onClick={() => toggle(product.productId)}
                className="flex w-full items-center justify-between bg-stone-50 px-6 py-4 text-left hover:bg-stone-100/70"
              >
                <div className="flex items-center gap-3">
                  <span className="text-stone-400">
                    {isOpen ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </span>
                  <div>
                    <div className="font-bold text-stone-900">{product.productName}</div>
                    <div className="text-xs text-stone-500">
                      {product.base.length} bahan base · {product.variants.length} varian
                    </div>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="space-y-5 px-6 py-5">
                  {/* BASE recipe */}
                  <div className="overflow-hidden rounded-xl border border-amber-100">
                    <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/60 px-4 py-2.5">
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                        <Cookie className="h-4 w-4" />
                        Base Recipe (semua varian)
                      </span>
                      <button
                        onClick={() =>
                          setAddForm(
                            addForm?.sectionKey === sectionKeyBase
                              ? null
                              : {
                                  sectionKey: sectionKeyBase,
                                  ingredientId: "",
                                  qtyPerUnit: "",
                                },
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        {addForm?.sectionKey === sectionKeyBase ? (
                          <>
                            <X className="h-3 w-3" /> Batal
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" /> Tambah Bahan
                          </>
                        )}
                      </button>
                    </div>

                    {addForm?.sectionKey === sectionKeyBase && (
                      <div className="flex flex-wrap items-end gap-3 border-b border-amber-100 bg-amber-50/30 px-4 py-3">
                        <div className="min-w-48 flex-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                            Bahan
                          </label>
                          <select
                            value={addForm.ingredientId}
                            onChange={(e) =>
                              setAddForm({ ...addForm, ingredientId: e.target.value })
                            }
                            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm focus:border-amber-600 focus:outline-hidden"
                          >
                            <option value="">— pilih bahan —</option>
                            {ingredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} ({ing.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                            Takaran / pcs
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={addForm.qtyPerUnit}
                            onChange={(e) =>
                              setAddForm({ ...addForm, qtyPerUnit: e.target.value })
                            }
                            placeholder="50"
                            className="mt-1 w-full rounded-lg border border-stone-200 px-2.5 py-2 text-sm focus:border-amber-600 focus:outline-hidden"
                          />
                        </div>
                        <button
                          onClick={handleSaveRow}
                          disabled={isPending || !addForm.ingredientId}
                          className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                        >
                          Simpan
                        </button>
                      </div>
                    )}

                    <RecipeRows
                      rows={product.base}
                      onDelete={handleDeleteRow}
                      isPending={isPending}
                    />
                  </div>

                  {/* TOPPING per variant */}
                  <div className="space-y-3">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                      <Layers className="h-4 w-4" />
                      Topping per Varian
                    </span>

                    {product.variants.map((variant) => {
                      const sectionKey = `topping:${variant.variantId}`;

                      return (
                        <div
                          key={variant.variantId}
                          className="overflow-hidden rounded-xl border border-stone-200"
                        >
                          <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-4 py-2.5">
                            <span className="text-sm font-semibold text-stone-800">
                              {variant.variantName}
                            </span>
                            <button
                              onClick={() =>
                                setAddForm(
                                  addForm?.sectionKey === sectionKey
                                    ? null
                                    : {
                                        sectionKey,
                                        ingredientId: "",
                                        qtyPerUnit: "",
                                      },
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                            >
                              {addForm?.sectionKey === sectionKey ? (
                                <>
                                  <X className="h-3 w-3" /> Batal
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3" /> Tambah
                                </>
                              )}
                            </button>
                          </div>

                          {addForm?.sectionKey === sectionKey && (
                            <div className="flex flex-wrap items-end gap-3 border-b border-stone-100 bg-stone-50/50 px-4 py-3">
                              <div className="min-w-48 flex-1">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                                  Bahan
                                </label>
                                <select
                                  value={addForm.ingredientId}
                                  onChange={(e) =>
                                    setAddForm({ ...addForm, ingredientId: e.target.value })
                                  }
                                  className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm focus:border-amber-600 focus:outline-hidden"
                                >
                                  <option value="">— pilih bahan —</option>
                                  {ingredients.map((ing) => (
                                    <option key={ing.id} value={ing.id}>
                                      {ing.name} ({ing.unit})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-32">
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                                  Takaran / pcs
                                </label>
                                <input
                                  type="number"
                                  step="any"
                                  value={addForm.qtyPerUnit}
                                  onChange={(e) =>
                                    setAddForm({ ...addForm, qtyPerUnit: e.target.value })
                                  }
                                  placeholder="15"
                                  className="mt-1 w-full rounded-lg border border-stone-200 px-2.5 py-2 text-sm focus:border-amber-600 focus:outline-hidden"
                                />
                              </div>
                              <button
                                onClick={handleSaveRow}
                                disabled={isPending || !addForm.ingredientId}
                                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                              >
                                Simpan
                              </button>
                            </div>
                          )}

                          <RecipeRows
                            rows={variant.topping}
                            onDelete={handleDeleteRow}
                            isPending={isPending}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
