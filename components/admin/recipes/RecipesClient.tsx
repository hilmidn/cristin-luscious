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

const fieldLabel =
  "mb-1.5 block font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text";

const fieldInput =
  "mt-1 w-full border border-brand-border bg-brand-bg px-3 py-2.5 font-sans text-xs text-brand-dark outline-none transition-colors focus:border-brand-dark placeholder:text-brand-muted";

const buttonPrimary =
  "inline-flex items-center justify-center gap-1.5 border border-brand-dark bg-brand-dark px-3.5 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark disabled:opacity-50";

const buttonGhost =
  "inline-flex items-center justify-center gap-1.5 border border-brand-border bg-brand-bg px-3.5 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark disabled:opacity-50";

function RecipeRows({
  rows,
  onDelete,
  isPending,
}: {
  rows: RecipeRow[];
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-4 font-sans text-[10px] uppercase tracking-[0.18em] text-brand-muted">
        Belum ada bahan di resep ini
      </p>
    );
  }

  return (
    <div className="divide-y divide-brand-border/70">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Cookie className="h-3.5 w-3.5 shrink-0 text-brand-muted" />
            <span className="truncate font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-dark">
              {row.ingredientName}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-mono text-[11px] font-semibold text-brand-dark">
              {row.qtyPerUnit.toLocaleString("id-ID")} {row.unit}
              <span className="ml-1 font-sans text-[9px] font-light normal-case tracking-normal text-brand-muted">
                / pcs
              </span>
            </span>
            <button
              onClick={() => onDelete(row.id)}
              disabled={isPending}
              className="border border-brand-border bg-brand-bg p-1.5 text-brand-muted transition-colors hover:border-brand-dark hover:text-brand-dark disabled:opacity-50"
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
      <div className="border border-brand-dark bg-brand-card p-6 font-sans text-[11px] leading-relaxed text-brand-dark">
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
        <div className="border border-brand-dark bg-brand-card px-4 py-3 font-sans text-[11px] text-brand-dark">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <p className="border border-dashed border-brand-border bg-brand-card px-6 py-14 text-center font-sans text-[10px] uppercase tracking-[0.22em] text-brand-muted">
          Belum ada produk di katalog
        </p>
      ) : (
        products.map((product) => {
          const isOpen = expanded[product.productId] ?? false;
          const sectionKeyBase = `base:${product.productId}`;

          return (
            <div key={product.productId} className="border border-brand-border bg-brand-bg">
              {/* Product header */}
              <button
                onClick={() => toggle(product.productId)}
                className="flex w-full items-center justify-between bg-brand-card px-5 py-4 text-left transition-colors hover:bg-brand-border/40 sm:px-6"
              >
                <div className="flex items-center gap-3">
                  <span className="text-brand-muted">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                      {product.productName}
                    </div>
                    <div className="mt-0.5 font-sans text-[9px] uppercase tracking-[0.2em] text-brand-text">
                      {product.base.length} bahan base · {product.variants.length} varian
                    </div>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="space-y-6 px-5 py-5 sm:px-6">
                  {/* BASE recipe */}
                  <div className="border border-brand-border">
                    <div className="flex items-center justify-between gap-3 border-b border-brand-border bg-brand-card px-4 py-3">
                      <span className="flex items-center gap-2 font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-dark">
                        <Cookie className="h-3.5 w-3.5" />
                        Base Recipe · Semua Varian
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
                        className={
                          addForm?.sectionKey === sectionKeyBase ? buttonGhost : buttonPrimary
                        }
                      >
                        {addForm?.sectionKey === sectionKeyBase ? (
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

                    {addForm?.sectionKey === sectionKeyBase && (
                      <div className="flex flex-col gap-3 border-b border-brand-border bg-brand-card/60 px-4 py-4 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label className={fieldLabel}>Bahan</label>
                          <select
                            value={addForm.ingredientId}
                            onChange={(e) =>
                              setAddForm({ ...addForm, ingredientId: e.target.value })
                            }
                            className={fieldInput}
                          >
                            <option value="">— pilih bahan —</option>
                            {ingredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} ({ing.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:w-36">
                          <label className={fieldLabel}>Takaran / pcs</label>
                          <input
                            type="number"
                            step="any"
                            value={addForm.qtyPerUnit}
                            onChange={(e) =>
                              setAddForm({ ...addForm, qtyPerUnit: e.target.value })
                            }
                            placeholder="50"
                            className={fieldInput}
                          />
                        </div>
                        <button
                          onClick={handleSaveRow}
                          disabled={isPending || !addForm.ingredientId}
                          className={buttonPrimary}
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
                    <span className="flex items-center gap-2 font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
                      <Layers className="h-3.5 w-3.5" />
                      Topping per Varian
                    </span>

                    {product.variants.map((variant) => {
                      const sectionKey = `topping:${variant.variantId}`;

                      return (
                        <div key={variant.variantId} className="border border-brand-border">
                          <div className="flex items-center justify-between gap-3 border-b border-brand-border bg-brand-card px-4 py-3">
                            <span className="truncate font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-dark">
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
                              className={
                                addForm?.sectionKey === sectionKey ? buttonGhost : buttonGhost
                              }
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
                            <div className="flex flex-col gap-3 border-b border-brand-border bg-brand-card/60 px-4 py-4 sm:flex-row sm:items-end">
                              <div className="flex-1">
                                <label className={fieldLabel}>Bahan</label>
                                <select
                                  value={addForm.ingredientId}
                                  onChange={(e) =>
                                    setAddForm({ ...addForm, ingredientId: e.target.value })
                                  }
                                  className={fieldInput}
                                >
                                  <option value="">— pilih bahan —</option>
                                  {ingredients.map((ing) => (
                                    <option key={ing.id} value={ing.id}>
                                      {ing.name} ({ing.unit})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="sm:w-36">
                                <label className={fieldLabel}>Takaran / pcs</label>
                                <input
                                  type="number"
                                  step="any"
                                  value={addForm.qtyPerUnit}
                                  onChange={(e) =>
                                    setAddForm({ ...addForm, qtyPerUnit: e.target.value })
                                  }
                                  placeholder="15"
                                  className={fieldInput}
                                />
                              </div>
                              <button
                                onClick={handleSaveRow}
                                disabled={isPending || !addForm.ingredientId}
                                className={buttonPrimary}
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
