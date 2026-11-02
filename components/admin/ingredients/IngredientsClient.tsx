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
  AlertTriangle,
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

function emptyForm(): FormState {
  return { name: "", unit: "gram", minStockQty: "0", note: "" };
}

export function IngredientsClient({ ingredients }: { ingredients: IngredientRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<ModalMode>({ kind: "none" });
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const [purchaseQty, setPurchaseQty] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [purchaseSupplier, setPurchaseSupplier] = useState("");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const lowCount = useMemo(
    () => ingredients.filter((ing) => ing.isLow).length,
    [ingredients],
  );
  const totalPurchasedQty = useMemo(
    () => ingredients.reduce((acc, ing) => acc + ing.totalPurchased, 0),
    [ingredients],
  );

  const refresh = () => {
    startTransition(() => router.refresh());
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
      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Total Jenis Bahan
          </p>
          <p className="mt-1 text-2xl font-extrabold text-stone-900">
            {ingredients.length} <span className="text-sm font-normal text-stone-500">bahan</span>
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Stok Menipis
            </p>
            <AlertTriangle
              className={`h-5 w-5 ${lowCount > 0 ? "text-red-500" : "text-stone-300"}`}
            />
          </div>
          <p className={`mt-1 text-2xl font-extrabold ${lowCount > 0 ? "text-red-600" : "text-stone-900"}`}>
            {lowCount} <span className="text-sm font-normal text-stone-500">bahan</span>
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Total Bahan Terbeli
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">
            {totalPurchasedQty.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-stone-600">
          Stok otomatis terpotong saat nota mencapai <strong>Selesai Produksi</strong>.
        </p>
        <button
          onClick={() => openForm(null)}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Tambah Bahan
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-6 py-4">Bahan</th>
                <th className="px-6 py-4 text-right">Stok Saat Ini</th>
                <th className="px-6 py-4 text-right">Ambang Alert</th>
                <th className="px-6 py-4 text-right">Total Dibeli</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {ingredients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                    Belum ada bahan baku. Klik "Tambah Bahan" untuk mulai.
                  </td>
                </tr>
              ) : (
                ingredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-stone-50/70">
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900">{ing.name}</div>
                      <div className="text-xs text-stone-500">Satuan: {ing.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          ing.isLow
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {ing.stockQty.toLocaleString("id-ID")} {ing.unit}
                        {ing.isLow ? " ⚠" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-stone-600">
                      {ing.minStockQty.toLocaleString("id-ID")} {ing.unit}
                    </td>
                    <td className="px-6 py-4 text-right text-stone-600">
                      {ing.totalPurchased.toLocaleString("id-ID")} {ing.unit}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openPurchase(ing)}
                          className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                          title="Catat pembelian (stock-in)"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Beli
                        </button>
                        <button
                          onClick={() => openAdjust(ing)}
                          className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                          title="Koreksi stok manual"
                        >
                          <Scale className="h-3.5 w-3.5" />
                          Koreksi
                        </button>
                        <button
                          onClick={() => setModal({ kind: "history", ingredient: ing })}
                          className="rounded-xl border border-stone-200 bg-white p-2 text-stone-500 hover:bg-stone-50"
                          title="Riwayat pembelian"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openForm(ing)}
                          className="rounded-xl border border-stone-200 bg-white p-2 text-stone-500 hover:bg-stone-50"
                          title="Edit bahan"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => submitDelete(ing)}
                          className="rounded-xl border border-red-100 bg-white p-2 text-red-500 hover:bg-red-50"
                          title="Hapus bahan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal.kind !== "none" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">
                {modal.kind === "form" && (modal.editing ? "Edit Bahan" : "Tambah Bahan")}
                {modal.kind === "purchase" && `Pembelian: ${modal.ingredient.name}`}
                {modal.kind === "adjust" && `Koreksi Stok: ${modal.ingredient.name}`}
                {modal.kind === "history" && `Riwayat: ${modal.ingredient.name}`}
              </h3>
              <button
                onClick={() => setModal({ kind: "none" })}
                className="rounded-lg p-2 text-stone-400 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {modal.kind === "form" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Nama Bahan
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Tepung Kentang"
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-600 focus:outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Satuan
                    </label>
                    <input
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      placeholder="gram / ml / pcs"
                      className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Ambang Stok Rendah
                    </label>
                    <input
                      type="number"
                      value={form.minStockQty}
                      onChange={(e) => setForm({ ...form, minStockQty: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-600 focus:outline-hidden"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Catatan (opsional)
                  </label>
                  <input
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-600 focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setModal({ kind: "none" })}
                    className="rounded-xl bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-200"
                  >
                    Batal
                  </button>
                  <button
                    onClick={submitForm}
                    disabled={isPending}
                    className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                  >
                    {modal.editing ? "Simpan" : "Tambah"}
                  </button>
                </div>
              </div>
            )}

            {modal.kind === "purchase" && (
              <div className="space-y-4">
                <p className="text-sm text-stone-600">
                  Stok saat ini:{" "}
                  <strong>
                    {modal.ingredient.stockQty.toLocaleString("id-ID")} {modal.ingredient.unit}
                  </strong>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Jumlah ({modal.ingredient.unit})
                    </label>
                    <input
                      type="number"
                      value={purchaseQty}
                      onChange={(e) => setPurchaseQty(e.target.value)}
                      placeholder="1000"
                      className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Harga per {modal.ingredient.unit} (Rp)
                    </label>
                    <input
                      type="number"
                      value={purchaseCost}
                      onChange={(e) => setPurchaseCost(e.target.value)}
                      placeholder="15000"
                      className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-600 focus:outline-hidden"
                    />
                  </div>
                </div>
                {Number(purchaseCost) > 0 && (
                  <p className="text-sm text-stone-600">
                    Total:{" "}
                    <strong className="text-amber-700">
                      {formatRupiah(Math.round((Number(purchaseQty) || 0) * Number(purchaseCost)))}
                    </strong>
                  </p>
                )}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Supplier / Toko (opsional)
                  </label>
                  <input
                    value={purchaseSupplier}
                    onChange={(e) => setPurchaseSupplier(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-600 focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setModal({ kind: "none" })}
                    className="rounded-xl bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-200"
                  >
                    Batal
                  </button>
                  <button
                    onClick={submitPurchase}
                    disabled={isPending}
                    className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                  >
                    Catat Pembelian
                  </button>
                </div>
              </div>
            )}

            {modal.kind === "adjust" && (
              <div className="space-y-4">
                <p className="text-sm text-stone-600">
                  Gunakan plus untuk menambah atau minus untuk mengurangi. Setiap koreksi tercatat di riwayat pergerakan.
                </p>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Koreksi ({modal.ingredient.unit})
                  </label>
                  <input
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    placeholder="misal: -100 atau 250"
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Alasan (opsional)
                  </label>
                  <input
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    placeholder="misal: stok opname"
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm focus:border-amber-600 focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setModal({ kind: "none" })}
                    className="rounded-xl bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-200"
                  >
                    Batal
                  </button>
                  <button
                    onClick={submitAdjust}
                    disabled={isPending}
                    className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                  >
                    Simpan Koreksi
                  </button>
                </div>
              </div>
            )}

            {modal.kind === "history" && (
              <div className="space-y-3">
                {modal.ingredient.recentPurchases.length === 0 ? (
                  <p className="py-4 text-center text-sm text-stone-500">
                    Belum ada pembelian tercatat.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
                    {modal.ingredient.recentPurchases.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 text-sm">
                        <div>
                          <div className="font-semibold text-stone-900">
                            +{p.qty.toLocaleString("id-ID")} {modal.ingredient.unit}
                          </div>
                          <div className="text-xs text-stone-500">
                            {new Date(p.purchasedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {p.supplier ? ` · ${p.supplier}` : ""}
                          </div>
                        </div>
                        <div className="text-right font-bold text-amber-700">
                          {p.totalCost > 0 ? formatRupiah(p.totalCost) : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setModal({ kind: "none" })}
                    className="rounded-xl bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-200"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
