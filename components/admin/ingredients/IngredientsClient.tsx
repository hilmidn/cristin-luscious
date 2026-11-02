"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/order-types";
import type { IngredientRow } from "@/lib/inventory-types";
import {
  createIngredientAction,
  deleteIngredientAction,
  purchaseAction,
  adjustStockAction,
  updateIngredientAction,
} from "@/app/admin/(panel)/ingredients/actions";
import {
  ChevronDown,
  History,
  Pencil,
  Plus,
  ShoppingCart,
  Scale,
  Trash2,
  X,
} from "lucide-react";

type ModalMode =
  | { kind: "none" }
  | { kind: "form"; editing: IngredientRow | null }
  | { kind: "purchase"; ingredient: IngredientRow }
  | { kind: "adjust"; ingredient: IngredientRow }
  | { kind: "history"; ingredient: IngredientRow };

type FormState = {
  name: string;
  unit: string;
  minStockQty: string;
  note: string;
};

const fieldLabel =
  "mb-1.5 block font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text";

const fieldInput =
  "mt-1 w-full border border-brand-border bg-brand-bg px-3 py-2.5 font-sans text-xs text-brand-dark outline-none transition-colors focus:border-brand-dark placeholder:text-brand-muted";

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 border border-brand-dark bg-brand-dark px-4 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark disabled:opacity-50";

const buttonGhost =
  "inline-flex items-center justify-center gap-2 border border-brand-border bg-brand-bg px-4 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark disabled:opacity-50";

function emptyForm(): FormState {
  return { name: "", unit: "gram", minStockQty: "0", note: "" };
}

export function IngredientsClient({ ingredients }: { ingredients: IngredientRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<ModalMode>({ kind: "none" });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [purchaseQty, setPurchaseQty] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [purchaseSupplier, setPurchaseSupplier] = useState("");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((ing) => ing.name.toLowerCase().includes(q));
  }, [ingredients, search]);

  const lowCount = useMemo(
    () => ingredients.filter((ing) => ing.isLow).length,
    [ingredients],
  );

  const totalPurchasedQty = useMemo(
    () => ingredients.reduce((acc, ing) => acc + ing.totalPurchased, 0),
    [ingredients],
  );

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openForm = (editing: IngredientRow | null) => {
    setError(null);
    setForm(
      editing
        ? {
            name: editing.name,
            unit: editing.unit,
            minStockQty: String(editing.minStockQty),
            note: editing.note ?? "",
          }
        : emptyForm(),
    );
    setModal({ kind: "form", editing });
  };

  const openPurchase = (ingredient: IngredientRow) => {
    setError(null);
    setPurchaseQty("");
    setPurchaseCost("");
    setPurchaseSupplier("");
    setModal({ kind: "purchase", ingredient });
  };

  const openAdjust = (ingredient: IngredientRow) => {
    setError(null);
    setAdjustQty("");
    setAdjustNote("");
    setModal({ kind: "adjust", ingredient });
  };

  const submitForm = () => {
    const payload = {
      name: form.name,
      unit: form.unit,
      minStockQty: Number(form.minStockQty) || 0,
      note: form.note,
    };

    startTransition(async () => {
      const result =
        modal.kind === "form" && modal.editing
          ? await updateIngredientAction(modal.editing.id, payload)
          : await createIngredientAction(payload);

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setModal({ kind: "none" });
      router.refresh();
    });
  };

  const submitPurchase = () => {
    if (modal.kind !== "purchase") return;

    startTransition(async () => {
      const result = await purchaseAction({
        ingredientId: modal.ingredient.id,
        qty: Number(purchaseQty) || 0,
        unitCost: Math.round(Number(purchaseCost) || 0),
        supplier: purchaseSupplier,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setModal({ kind: "none" });
      router.refresh();
    });
  };

  const submitAdjust = () => {
    if (modal.kind !== "adjust") return;

    startTransition(async () => {
      const result = await adjustStockAction(
        modal.ingredient.id,
        Number(adjustQty) || 0,
        adjustNote,
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setModal({ kind: "none" });
      router.refresh();
    });
  };

  const submitDelete = (ingredient: IngredientRow) => {
    if (!window.confirm(`Hapus bahan "${ingredient.name}"? Riwayat pembelian ikut terhapus.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteIngredientAction(ingredient.id);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div>
      {/* Ringkasan */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="border border-brand-border bg-brand-card px-5 py-4">
          <span className="block font-sans text-[8px] font-bold uppercase tracking-[0.28em] text-brand-text">
            Jenis Bahan
          </span>
          <p className="mt-1.5 font-playfair text-2xl font-bold text-brand-dark">
            {ingredients.length}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-5 py-4">
          <span className="block font-sans text-[8px] font-bold uppercase tracking-[0.28em] text-brand-text">
            Stok Rendah
          </span>
          <p className="mt-1.5 font-playfair text-2xl font-bold text-brand-dark">
            {lowCount}
          </p>
        </div>
        <div className="col-span-2 border border-brand-border bg-brand-card px-5 py-4 sm:col-span-1">
          <span className="block font-sans text-[8px] font-bold uppercase tracking-[0.28em] text-brand-text">
            Total Terbeli
          </span>
          <p className="mt-1.5 font-playfair text-2xl font-bold text-brand-dark">
            {totalPurchasedQty.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari bahan..."
          className="w-full border border-brand-border bg-brand-bg px-4 py-2.5 font-sans text-xs text-brand-dark outline-none transition-colors focus:border-brand-dark placeholder:text-brand-muted sm:max-w-xs"
        />
        <button onClick={() => openForm(null)} disabled={isPending} className={buttonPrimary}>
          <Plus className="h-3.5 w-3.5" />
          Tambah Bahan
        </button>
      </div>

      {/* Card grid */}
      {ingredients.length === 0 ? (
        <p className="border border-dashed border-brand-border bg-brand-card px-6 py-14 text-center font-sans text-[10px] uppercase tracking-[0.22em] text-brand-muted">
          Belum ada bahan baku — mulai dengan "Tambah Bahan"
        </p>
      ) : filtered.length === 0 ? (
        <p className="border border-dashed border-brand-border bg-brand-card px-6 py-14 text-center font-sans text-[10px] uppercase tracking-[0.22em] text-brand-muted">
          Tidak ada bahan yang cocok dengan "{search}"
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ing) => {
            const isOpen = expanded[ing.id] ?? false;

            return (
              <div
                key={ing.id}
                className={`flex flex-col border bg-brand-bg ${
                  ing.isLow ? "border-brand-dark" : "border-brand-border"
                }`}
              >
                {/* Card head — tap untuk buka/tutup aksi */}
                <button
                  onClick={() => toggle(ing.id)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-brand-card/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 truncate font-playfair text-base font-bold uppercase tracking-tight text-brand-dark">
                      {ing.name}
                    </h3>
                    <span
                      className={`shrink-0 border px-2 py-0.5 font-sans text-[8px] font-bold uppercase tracking-[0.2em] ${
                        ing.isLow
                          ? "border-brand-dark bg-brand-dark text-brand-bg"
                          : "border-brand-border bg-brand-card text-brand-text"
                      }`}
                    >
                      {ing.isLow ? "Rendah" : "Aman"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-end justify-between gap-2">
                    <p className="font-playfair text-2xl font-bold leading-none text-brand-dark">
                      {ing.stockQty.toLocaleString("id-ID")}
                      <span className="ml-1.5 font-sans text-[11px] font-light normal-case tracking-normal text-brand-text">
                        {ing.unit}
                      </span>
                    </p>
                    <span className="flex shrink-0 items-center gap-1 font-sans text-[9px] uppercase tracking-[0.14em] text-brand-text">
                      min {ing.minStockQty.toLocaleString("id-ID")}
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-brand-muted transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </div>
                </button>

                {/* Aksi — muncul setelah card ditap */}
                {isOpen && (
                  <div className="grid grid-cols-2 gap-2 border-t border-brand-border px-4 py-3">
                    <button
                      onClick={() => openPurchase(ing)}
                      disabled={isPending}
                      className={`${buttonPrimary} col-span-2`}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Catat Pembelian
                    </button>
                    <button onClick={() => openAdjust(ing)} className={buttonGhost}>
                      <Scale className="h-3.5 w-3.5" />
                      Koreksi
                    </button>
                    <button
                      onClick={() => setModal({ kind: "history", ingredient: ing })}
                      className={buttonGhost}
                    >
                      <History className="h-3.5 w-3.5" />
                      Riwayat
                    </button>
                    <button onClick={() => openForm(ing)} className={buttonGhost}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => submitDelete(ing)}
                      className="inline-flex items-center justify-center gap-2 border border-brand-border bg-brand-bg px-4 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-muted transition-colors hover:border-brand-dark hover:text-brand-dark disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modal.kind !== "none" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-dark/40 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto border border-brand-border bg-brand-bg shadow-2xl sm:max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
              <h3 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                {modal.kind === "form" && (modal.editing ? "Edit Bahan" : "Tambah Bahan")}
                {modal.kind === "purchase" && `Pembelian · ${modal.ingredient.name}`}
                {modal.kind === "adjust" && `Koreksi Stok · ${modal.ingredient.name}`}
                {modal.kind === "history" && `Riwayat · ${modal.ingredient.name}`}
              </h3>
              <button
                onClick={() => setModal({ kind: "none" })}
                className="p-1.5 text-brand-text transition-colors hover:text-brand-dark"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5">
              {error && (
                <div className="mb-4 border border-brand-dark bg-brand-card px-4 py-3 font-sans text-[11px] text-brand-dark">
                  {error}
                </div>
              )}

              {modal.kind === "form" && (
                <div className="space-y-4">
                  <div>
                    <label className={fieldLabel}>Nama Bahan</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Tepung Kentang"
                      className={fieldInput}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={fieldLabel}>Satuan</label>
                      <input
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        placeholder="gram / ml / pcs"
                        className={fieldInput}
                      />
                    </div>
                    <div>
                      <label className={fieldLabel}>Ambang Rendah</label>
                      <input
                        type="number"
                        value={form.minStockQty}
                        onChange={(e) => setForm({ ...form, minStockQty: e.target.value })}
                        className={fieldInput}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={fieldLabel}>Catatan (opsional)</label>
                    <input
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className={fieldInput}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setModal({ kind: "none" })} className={buttonGhost}>
                      Batal
                    </button>
                    <button onClick={submitForm} disabled={isPending} className={buttonPrimary}>
                      {modal.editing ? "Simpan" : "Tambah"}
                    </button>
                  </div>
                </div>
              )}

              {modal.kind === "purchase" && (
                <div className="space-y-4">
                  <p className="font-sans text-[11px] leading-relaxed text-brand-text">
                    Stok saat ini{" "}
                    <strong className="text-brand-dark">
                      {modal.ingredient.stockQty.toLocaleString("id-ID")} {modal.ingredient.unit}
                    </strong>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={fieldLabel}>Jumlah ({modal.ingredient.unit})</label>
                      <input
                        type="number"
                        value={purchaseQty}
                        onChange={(e) => setPurchaseQty(e.target.value)}
                        placeholder="1000"
                        className={fieldInput}
                      />
                    </div>
                    <div>
                      <label className={fieldLabel}>
                        Harga per {modal.ingredient.unit} (Rp)
                      </label>
                      <input
                        type="number"
                        value={purchaseCost}
                        onChange={(e) => setPurchaseCost(e.target.value)}
                        placeholder="15000"
                        className={fieldInput}
                      />
                    </div>
                  </div>
                  {Number(purchaseCost) > 0 && (
                    <p className="font-sans text-[11px] text-brand-text">
                      Total:{" "}
                      <strong className="text-brand-dark">
                        {formatRupiah(Math.round((Number(purchaseQty) || 0) * Number(purchaseCost)))}
                      </strong>
                    </p>
                  )}
                  <div>
                    <label className={fieldLabel}>Supplier / Toko (opsional)</label>
                    <input
                      value={purchaseSupplier}
                      onChange={(e) => setPurchaseSupplier(e.target.value)}
                      className={fieldInput}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setModal({ kind: "none" })} className={buttonGhost}>
                      Batal
                    </button>
                    <button
                      onClick={submitPurchase}
                      disabled={isPending}
                      className={buttonPrimary}
                    >
                      Catat
                    </button>
                  </div>
                </div>
              )}

              {modal.kind === "adjust" && (
                <div className="space-y-4">
                  <p className="font-sans text-[11px] leading-relaxed text-brand-text">
                    Plus untuk menambah, minus untuk mengurangi. Setiap koreksi tercatat di
                    riwayat pergerakan.
                  </p>
                  <div>
                    <label className={fieldLabel}>Koreksi ({modal.ingredient.unit})</label>
                    <input
                      type="number"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(e.target.value)}
                      placeholder="-100 atau 250"
                      className={fieldInput}
                    />
                  </div>
                  <div>
                    <label className={fieldLabel}>Alasan (opsional)</label>
                    <input
                      value={adjustNote}
                      onChange={(e) => setAdjustNote(e.target.value)}
                      placeholder="stok opname"
                      className={fieldInput}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setModal({ kind: "none" })} className={buttonGhost}>
                      Batal
                    </button>
                    <button
                      onClick={submitAdjust}
                      disabled={isPending}
                      className={buttonPrimary}
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}

              {modal.kind === "history" && (
                <div className="space-y-3">
                  {modal.ingredient.recentPurchases.length === 0 ? (
                    <p className="py-6 text-center font-sans text-[10px] uppercase tracking-[0.22em] text-brand-muted">
                      Belum ada pembelian tercatat
                    </p>
                  ) : (
                    <div className="divide-y divide-brand-border border border-brand-border">
                      {modal.ingredient.recentPurchases.map((p) => (
                        <div key={p.id} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <span className="block font-sans text-[11px] font-semibold text-brand-dark">
                              +{p.qty.toLocaleString("id-ID")} {modal.ingredient.unit}
                            </span>
                            <span className="mt-0.5 block font-sans text-[9px] uppercase tracking-[0.16em] text-brand-text">
                              {new Date(p.purchasedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                              {p.supplier ? ` · ${p.supplier}` : ""}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-brand-dark">
                            {p.totalCost > 0 ? formatRupiah(p.totalCost) : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end pt-1">
                    <button onClick={() => setModal({ kind: "none" })} className={buttonGhost}>
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
