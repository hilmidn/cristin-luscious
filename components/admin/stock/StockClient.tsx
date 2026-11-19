"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { adjustStockAction, getMovementsAction, restockAction } from "@/app/admin/(panel)/stock/actions";
import {
  FULFILLMENT_LABEL,
  STOCK_MOVEMENT_LABEL,
  type StockMovementRow,
  type StockRow,
} from "@/lib/stock-types";
import {
  Boxes,
  History,
  MoreVertical,
  PackagePlus,
  Scale,
  X,
} from "lucide-react";

type ModalMode =
  | { kind: "none" }
  | { kind: "restock"; row: StockRow }
  | { kind: "adjust"; row: StockRow }
  | { kind: "history"; row: StockRow };

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

function formatWib(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function StockClient({ stock }: { stock: StockRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<ModalMode>({ kind: "none" });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const [qty, setQty] = useState("");
  const [targetQty, setTargetQty] = useState("");
  const [note, setNote] = useState("");

  const [movements, setMovements] = useState<StockMovementRow[] | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return stock;

    return stock.filter(
      (row) =>
        row.productName.toLowerCase().includes(q) ||
        row.variantName.toLowerCase().includes(q),
    );
  }, [stock, search]);

  const readyCount = useMemo(
    () => stock.filter((row) => row.fulfillmentMode === "READY").length,
    [stock],
  );

  const outOfStockCount = useMemo(
    () => stock.filter((row) => row.fulfillmentMode === "READY" && row.stockQty <= 0).length,
    [stock],
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

  const openRestock = (row: StockRow) => {
    setError(null);
    setQty("");
    setNote("");
    setOpenMenuId(null);
    setModal({ kind: "restock", row });
  };

  const openAdjust = (row: StockRow) => {
    setError(null);
    setTargetQty(String(row.stockQty));
    setNote("");
    setOpenMenuId(null);
    setModal({ kind: "adjust", row });
  };

  const openHistory = (row: StockRow) => {
    setOpenMenuId(null);
    setModal({ kind: "history", row });
    setMovements(null);
    getMovementsAction(row.variantId)
      .then(setMovements)
      .catch(() => setMovements([]));
  };

  const submitRestock = () => {
    if (modal.kind !== "restock") return;

    startTransition(async () => {
      const result = await restockAction(
        modal.row.variantId,
        Number(qty) || 0,
        note,
      );

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
        modal.row.variantId,
        Number(targetQty) || 0,
        note,
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setModal({ kind: "none" });
      router.refresh();
    });
  };

  return (
    <div>
      {/* Ringkasan */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="border border-brand-border bg-brand-card px-5 py-4">
          <span className="block font-sans text-[8px] font-bold uppercase tracking-[0.28em] text-brand-text">
            Varian Dikelola
          </span>
          <p className="mt-1.5 font-playfair text-2xl font-bold text-brand-dark">
            {stock.length}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-5 py-4">
          <span className="block font-sans text-[8px] font-bold uppercase tracking-[0.28em] text-brand-text">
            Varian Ready
          </span>
          <p className="mt-1.5 font-playfair text-2xl font-bold text-brand-dark">
            {readyCount}
          </p>
        </div>
        <div className="col-span-2 border border-brand-border bg-brand-card px-5 py-4 sm:col-span-1">
          <span className="block font-sans text-[8px] font-bold uppercase tracking-[0.28em] text-brand-text">
            Stok Habis
          </span>
          <p className="mt-1.5 font-playfair text-2xl font-bold text-brand-dark">
            {outOfStockCount}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk atau varian..."
          className="w-full border border-brand-border bg-brand-bg px-4 py-2.5 font-sans text-xs text-brand-dark outline-none transition-colors focus:border-brand-dark placeholder:text-brand-muted sm:max-w-xs"
        />
      </div>

      {/* Tabel stok */}
      {filtered.length === 0 ? (
        <p className="border border-dashed border-brand-border bg-brand-card px-6 py-14 text-center font-sans text-[10px] uppercase tracking-[0.22em] text-brand-muted">
          {stock.length === 0
            ? "Belum ada varian produk — tambahkan dari halaman Produk"
            : `Tidak ada yang cocok dengan "${search}"`}
        </p>
      ) : (
        <div className="overflow-x-auto border border-brand-border bg-brand-bg">
          <table className="w-full text-left font-sans text-xs text-brand-dark">
            <thead className="border-b border-brand-border bg-brand-card font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
              <tr>
                <th className="px-5 py-3.5">Produk</th>
                <th className="px-5 py-3.5">Varian</th>
                <th className="px-5 py-3.5">Mode</th>
                <th className="px-5 py-3.5">Stok</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isOut = row.fulfillmentMode === "READY" && row.stockQty <= 0;
                const menuOpen = openMenuId === row.variantId;

                return (
                  <tr
                    key={row.variantId}
                    className={`border-b border-brand-border/70 transition-colors last:border-b-0 ${
                      isOut ? "bg-red-50/60" : "bg-brand-bg"
                    } hover:bg-brand-card/60`}
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={`font-semibold uppercase tracking-[0.06em] ${
                          isOut ? "text-red-600" : "text-brand-dark"
                        }`}
                      >
                        {row.productName}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[11px] text-brand-text">
                      {row.variantName}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`border px-2 py-1 font-sans text-[8px] font-bold uppercase tracking-[0.18em] ${
                          row.fulfillmentMode === "READY"
                            ? "border-brand-dark bg-brand-dark text-brand-bg"
                            : "border-brand-border text-brand-text"
                        }`}
                      >
                        {FULFILLMENT_LABEL[row.fulfillmentMode]}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-5 py-3.5 font-mono text-[11px] ${
                        isOut ? "font-semibold text-red-600" : ""
                      }`}
                    >
                      {row.stockQty.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect();
                          setMenuPos({
                            top: rect.bottom + 6,
                            right: window.innerWidth - rect.right,
                          });
                          setOpenMenuId(menuOpen ? null : row.variantId);
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
          const active = stock.find((row) => row.variantId === openMenuId);
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
                  onClick={() => openRestock(active)}
                  disabled={isPending}
                  className={menuItem}
                >
                  <PackagePlus className="h-3.5 w-3.5 text-brand-muted" />
                  Restock
                </button>
                <button
                  onClick={() => openAdjust(active)}
                  disabled={isPending}
                  className={menuItem}
                >
                  <Scale className="h-3.5 w-3.5 text-brand-muted" />
                  Koreksi Stok
                </button>
                <button onClick={() => openHistory(active)} className={menuItem}>
                  <History className="h-3.5 w-3.5 text-brand-muted" />
                  Riwayat
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
                {modal.kind === "restock" && `Restock · ${modal.row.productName}`}
                {modal.kind === "adjust" && `Koreksi Stok · ${modal.row.variantName}`}
                {modal.kind === "history" && `Riwayat · ${modal.row.variantName}`}
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

              {modal.kind === "restock" && (
                <div className="space-y-4">
                  <p className="font-sans text-[11px] leading-relaxed text-brand-text">
                    Stok sekarang{" "}
                    <strong className="font-mono text-brand-dark">
                      {modal.row.stockQty}
                    </strong>{" "}
                    — jumlah yang dimasukkan akan ditambahkan.
                  </p>
                  <div>
                    <label className={fieldLabel}>Jumlah Masuk</label>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="20"
                      className={fieldInput}
                    />
                  </div>
                  <div>
                    <label className={fieldLabel}>Catatan (opsional)</label>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="batch pagi"
                      className={fieldInput}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setModal({ kind: "none" })} className={buttonGhost}>
                      Batal
                    </button>
                    <button
                      onClick={submitRestock}
                      disabled={isPending || !Number(qty)}
                      className={buttonPrimary}
                    >
                      <Boxes className="h-3.5 w-3.5" />
                      Simpan
                    </button>
                  </div>
                </div>
              )}

              {modal.kind === "adjust" && (
                <div className="space-y-4">
                  <p className="font-sans text-[11px] leading-relaxed text-brand-text">
                    Set stok ke nilai tertentu. Selisihnya tercatat sebagai satu koreksi di
                    riwayat.
                  </p>
                  <div>
                    <label className={fieldLabel}>Stok Akhir</label>
                    <input
                      type="number"
                      value={targetQty}
                      onChange={(e) => setTargetQty(e.target.value)}
                      className={fieldInput}
                    />
                  </div>
                  <div>
                    <label className={fieldLabel}>Alasan (opsional)</label>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="stok opname / barang rusak"
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
                  {movements === null ? (
                    <p className="py-6 text-center font-sans text-[10px] uppercase tracking-[0.22em] text-brand-muted">
                      Memuat riwayat...
                    </p>
                  ) : movements.length === 0 ? (
                    <p className="py-6 text-center font-sans text-[10px] uppercase tracking-[0.22em] text-brand-muted">
                      Belum ada pergerakan tercatat
                    </p>
                  ) : (
                    <div className="divide-y divide-brand-border border border-brand-border">
                      {movements.map((movement) => (
                        <div key={movement.id} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <span
                              className={`block font-mono text-[11px] font-semibold ${
                                movement.qty < 0 ? "text-red-600" : "text-brand-dark"
                              }`}
                            >
                              {movement.qty > 0 ? "+" : ""}
                              {movement.qty}{" "}
                              <span className="font-sans text-[9px] uppercase tracking-[0.16em] text-brand-text">
                                {STOCK_MOVEMENT_LABEL[movement.type]}
                              </span>
                            </span>
                            <span className="mt-0.5 block font-sans text-[9px] uppercase tracking-[0.16em] text-brand-text">
                              {formatWib(movement.createdAt)}
                              {movement.orderCode ? ` · ${movement.orderCode}` : ""}
                            </span>
                            {movement.note && (
                              <span className="mt-0.5 block font-sans text-[10px] text-brand-text">
                                {movement.note}
                              </span>
                            )}
                          </div>
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
