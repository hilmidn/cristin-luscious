"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
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
  History,
  MoreVertical,
  Pencil,
  Plus,
  ReceiptText,
  ShoppingCart,
  Scale,
  Trash2,
  X,
} from "lucide-react";

type ModalMode =
  | { kind: "none" }
  | { kind: "form"; editing: IngredientRow | null }
  | { kind: "purchase-note"; initialIngredient: IngredientRow | null }
  | { kind: "adjust"; ingredient: IngredientRow }
  | { kind: "history"; ingredient: IngredientRow };

type FormState = {
  name: string;
  unit: string;
  minStockQty: string;
  note: string;
};

type NoteRow = {
  key: string;
  ingredientId: string;
  qty: string;
  totalPrice: string;
};

let noteRowSeq = 0;
function newNoteRow(): NoteRow {
  noteRowSeq += 1;
  return { key: `row-${noteRowSeq}`, ingredientId: "", qty: "", totalPrice: "" };
}

const fieldLabel =
  "mb-1.5 block font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text";

const fieldInput =
  "mt-1 w-full border border-brand-border bg-brand-bg px-3 py-2.5 font-sans text-xs text-brand-dark outline-none transition-colors focus:border-brand-dark placeholder:text-brand-muted";

const buttonPrimary =
  "inline-flex items-center justify-center gap-2 border border-brand-dark bg-brand-dark px-4 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark disabled:opacity-50";

const buttonGhost =
  "inline-flex items-center justify-center gap-2 border border-brand-border bg-brand-bg px-4 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark disabled:opacity-50";

const menuItem =
  "flex w-full items-center gap-2.5 px-4 py-2.5 text-left font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-dark transition-colors hover:bg-brand-card disabled:opacity-50";

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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  // Nota pembelian (multi bahan)
  const [noteRows, setNoteRows] = useState<NoteRow[]>([]);
  const [noteSupplier, setNoteSupplier] = useState("");
  const [noteDate, setNoteDate] = useState("");
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

  const noteTotal = useMemo(
    () =>
      noteRows.reduce(
        (acc, row) => acc + (Number(row.totalPrice) || 0),
        0,
      ),
    [noteRows],
  );

  // Popover tutup saat halaman discroll/di-resize (posisi fixed jadi salah).
  useEffect(() => {
    if (!openMenuId) return;

    const close = () => setOpenMenuId(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);

    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openMenuId]);

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

  const openPurchaseNote = (initialIngredient: IngredientRow | null) => {
    setError(null);
    setNoteSupplier("");
    setNoteDate("");
    setNoteRows([
      initialIngredient
        ? { ...newNoteRow(), ingredientId: initialIngredient.id }
        : newNoteRow(),
    ]);
    setOpenMenuId(null);
    setModal({ kind: "purchase-note", initialIngredient });
  };

  const openAdjust = (ingredient: IngredientRow) => {
    setError(null);
    setAdjustQty("");
    setAdjustNote("");
    setOpenMenuId(null);
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

  const submitPurchaseNote = () => {
    const items = noteRows
      .filter((row) => row.ingredientId && Number(row.qty) > 0 && Number(row.totalPrice) > 0)
      .map((row) => ({
        ingredientId: row.ingredientId,
        qty: Number(row.qty) || 0,
        // Harga per unit dihitung dari total yang dibayar ÷ jumlah.
        unitCost: Math.round(Number(row.totalPrice) / Number(row.qty)) || 0,
      }));

    startTransition(async () => {
      const result = await purchaseAction({
        supplier: noteSupplier,
        purchasedAt: noteDate || undefined,
        items,
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => openPurchaseNote(null)}
            disabled={isPending || ingredients.length === 0}
            className={buttonPrimary}
          >
            <ReceiptText className="h-3.5 w-3.5" />
            Nota Pembelian
          </button>
          <button onClick={() => openForm(null)} disabled={isPending} className={buttonGhost}>
            <Plus className="h-3.5 w-3.5" />
            Tambah Bahan
          </button>
        </div>
      </div>

      {/* Tabel bahan */}
      {ingredients.length === 0 ? (
        <p className="border border-dashed border-brand-border bg-brand-card px-6 py-14 text-center font-sans text-[10px] uppercase tracking-[0.22em] text-brand-muted">
          Belum ada bahan baku — mulai dengan "Tambah Bahan"
        </p>
      ) : filtered.length === 0 ? (
        <p className="border border-dashed border-brand-border bg-brand-card px-6 py-14 text-center font-sans text-[10px] uppercase tracking-[0.22em] text-brand-muted">
          Tidak ada bahan yang cocok dengan "{search}"
        </p>
      ) : (
        <div className="overflow-x-auto border border-brand-border bg-brand-bg">
          <table className="w-full text-left font-sans text-xs text-brand-dark">
            <thead className="border-b border-brand-border bg-brand-card font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
              <tr>
                <th className="px-5 py-3.5">Bahan</th>
                <th className="px-5 py-3.5">Stok</th>
                <th className="px-5 py-3.5">Min Stok</th>
                <th className="px-5 py-3.5">Catatan</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ing) => {
                const menuOpen = openMenuId === ing.id;

                return (
                  <tr
                    key={ing.id}
                    className={`border-b border-brand-border/70 transition-colors last:border-b-0 ${
                      ing.isLow ? "bg-red-50/60" : "bg-brand-bg"
                    } hover:bg-brand-card/60`}
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={`font-semibold uppercase tracking-[0.06em] ${
                          ing.isLow ? "text-red-600" : "text-brand-dark"
                        }`}
                      >
                        {ing.name}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-5 py-3.5 font-mono text-[11px] ${
                        ing.isLow ? "font-semibold text-red-600" : ""
                      }`}
                    >
                      {ing.stockQty.toLocaleString("id-ID")}{" "}
                      <span className="font-sans text-[10px] text-brand-text">{ing.unit}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[11px] text-brand-text">
                      {ing.minStockQty.toLocaleString("id-ID")}{" "}
                      <span className="font-sans text-[10px]">{ing.unit}</span>
                    </td>
                    <td className="max-w-[240px] truncate px-5 py-3.5 text-[11px] text-brand-text">
                      {ing.note || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect();
                          setMenuPos({
                            top: rect.bottom + 6,
                            right: window.innerWidth - rect.right,
                          });
                          setOpenMenuId(menuOpen ? null : ing.id);
                        }}
                        className="inline-flex items-center justify-center border border-brand-border bg-brand-bg p-2 text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark"
                        title="Aksi"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Popover aksi (portal ke body supaya keluar dari tabel) */}
      {openMenuId &&
        menuPos &&
        (() => {
          const active = ingredients.find((i) => i.id === openMenuId);
          if (!active) return null;

          return createPortal(
            <>
              {/* Click-outside */}
              <div className="fixed inset-0 z-[55]" onClick={() => setOpenMenuId(null)} />
              <div
                className="fixed z-[60] w-44 border border-brand-border bg-brand-bg shadow-lg"
                style={{ top: menuPos.top, right: menuPos.right }}
              >
                <button
                  onClick={() => openPurchaseNote(active)}
                  disabled={isPending}
                  className={menuItem}
                >
                  <ShoppingCart className="h-3.5 w-3.5 text-brand-muted" />
                  Catat Pembelian
                </button>
                <button
                  onClick={() => openAdjust(active)}
                  disabled={isPending}
                  className={menuItem}
                >
                  <Scale className="h-3.5 w-3.5 text-brand-muted" />
                  Koreksi Stok
                </button>
                <button
                  onClick={() => {
                    setOpenMenuId(null);
                    setModal({ kind: "history", ingredient: active });
                  }}
                  className={menuItem}
                >
                  <History className="h-3.5 w-3.5 text-brand-muted" />
                  Riwayat
                </button>
                <button
                  onClick={() => openForm(active)}
                  disabled={isPending}
                  className={menuItem}
                >
                  <Pencil className="h-3.5 w-3.5 text-brand-muted" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setOpenMenuId(null);
                    submitDelete(active);
                  }}
                  disabled={isPending}
                  className={`${menuItem} text-brand-muted hover:text-brand-dark`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus
                </button>
              </div>
            </>,
            document.body,
          );
        })()}

      {/* Modals */}
      {modal.kind !== "none" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-dark/40 backdrop-blur-xs sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto border border-brand-border bg-brand-bg shadow-2xl sm:max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
              <h3 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                {modal.kind === "form" && (modal.editing ? "Edit Bahan" : "Tambah Bahan")}
                {modal.kind === "purchase-note" && "Nota Pembelian"}
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

              {modal.kind === "purchase-note" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={fieldLabel}>Supplier / Toko</label>
                      <input
                        value={noteSupplier}
                        onChange={(e) => setNoteSupplier(e.target.value)}
                        placeholder="Bakery Supply"
                        className={fieldInput}
                      />
                    </div>
                    <div>
                      <label className={fieldLabel}>Tanggal</label>
                      <input
                        type="date"
                        value={noteDate}
                        onChange={(e) => setNoteDate(e.target.value)}
                        className={fieldInput}
                      />
                    </div>
                  </div>

                  {/* Baris bahan */}
                  <div className="space-y-2">
                    <label className={fieldLabel}>Bahan Dibeli</label>
                    {noteRows.map((row, index) => (
                      <div
                        key={row.key}
                        className="space-y-2 border border-brand-border bg-brand-card/60 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-sans text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text">
                            Bahan {index + 1}
                          </span>
                          {noteRows.length > 1 && (
                            <button
                              onClick={() =>
                                setNoteRows(noteRows.filter((r) => r.key !== row.key))
                              }
                              className="p-1 text-brand-muted transition-colors hover:text-brand-dark"
                              title="Hapus baris"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <select
                          value={row.ingredientId}
                          onChange={(e) =>
                            setNoteRows(
                              noteRows.map((r) =>
                                r.key === row.key ? { ...r, ingredientId: e.target.value } : r,
                              ),
                            )
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
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={row.qty}
                            onChange={(e) =>
                              setNoteRows(
                                noteRows.map((r) =>
                                  r.key === row.key ? { ...r, qty: e.target.value } : r,
                                ),
                              )
                            }
                            placeholder={`Jumlah`}
                            className={fieldInput}
                          />
                          <input
                            type="number"
                            value={row.totalPrice}
                            onChange={(e) =>
                              setNoteRows(
                                noteRows.map((r) =>
                                  r.key === row.key ? { ...r, totalPrice: e.target.value } : r,
                                ),
                              )
                            }
                            placeholder="Harga total (Rp)"
                            className={fieldInput}
                          />
                        </div>
                        {Number(row.qty) > 0 && Number(row.totalPrice) > 0 && (
                          <p className="font-sans text-[9px] uppercase tracking-[0.14em] text-brand-text">
                            ≈ Rp
                            {Math.round(Number(row.totalPrice) / Number(row.qty)).toLocaleString(
                              "id-ID",
                            )}{" "}
                            /{" "}
                            {ingredients.find((i) => i.id === row.ingredientId)?.unit ?? "unit"}
                          </p>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => setNoteRows([...noteRows, newNoteRow()])}
                      className={`${buttonGhost} w-full`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah Baris Bahan
                    </button>
                  </div>

                  <div className="border-t border-brand-border pt-3">
                    <p className="font-sans text-[11px] text-brand-text">
                      Total Nota:{" "}
                      <strong className="text-brand-dark">
                        {formatRupiah(Math.round(noteTotal))}
                      </strong>
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setModal({ kind: "none" })} className={buttonGhost}>
                      Batal
                    </button>
                    <button
                      onClick={submitPurchaseNote}
                      disabled={isPending || noteTotal <= 0}
                      className={buttonPrimary}
                    >
                      Simpan Nota
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
