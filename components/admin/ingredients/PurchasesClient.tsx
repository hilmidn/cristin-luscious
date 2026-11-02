"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/order-types";
import type { PurchaseNoteRow } from "@/lib/inventory-types";
import {
  ChevronDown,
  ChevronRight,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PurchasesClient({ notes }: { notes: PurchaseNoteRow[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const totalSpend = useMemo(
    () => notes.reduce((acc, note) => acc + note.totalCost, 0),
    [notes],
  );

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      {/* Ringkasan */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="border border-brand-border bg-brand-card px-5 py-4">
          <span className="block font-sans text-[8px] font-bold uppercase tracking-[0.28em] text-brand-text">
            Jumlah Nota
          </span>
          <p className="mt-1.5 font-playfair text-2xl font-bold text-brand-dark">
            {notes.length}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-5 py-4">
          <span className="block font-sans text-[8px] font-bold uppercase tracking-[0.28em] text-brand-text">
            Total Pengeluaran
          </span>
          <p className="mt-1.5 font-playfair text-2xl font-bold text-brand-dark">
            {formatRupiah(totalSpend)}
          </p>
        </div>
      </div>

      {/* Daftar nota */}
      {notes.length === 0 ? (
        <p className="border border-dashed border-brand-border bg-brand-card px-6 py-14 text-center font-sans text-[10px] uppercase tracking-[0.22em] text-brand-muted">
          Belum ada nota pembelian — catat dari halaman Bahan Baku
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const isOpen = expanded[note.id] ?? false;

            return (
              <div key={note.id} className="border border-brand-border bg-brand-bg">
                <button
                  onClick={() => toggle(note.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-brand-card/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-brand-muted">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-playfair text-base font-bold uppercase tracking-tight text-brand-dark">
                        {note.supplier || "Pembelian Bahan"}
                      </div>
                      <div className="mt-0.5 font-sans text-[9px] uppercase tracking-[0.16em] text-brand-text">
                        {formatDate(note.purchasedAt)} · {note.itemCount} bahan
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold text-brand-dark">
                    {formatRupiah(note.totalCost)}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-brand-border px-5 py-4">
                    <div className="divide-y divide-brand-border/70 border border-brand-border">
                      {note.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 px-4 py-2.5"
                        >
                          <div className="min-w-0">
                            <span className="block truncate font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-dark">
                              {item.ingredientName}
                            </span>
                            <span className="mt-0.5 block font-sans text-[9px] uppercase tracking-[0.14em] text-brand-text">
                              {item.qty.toLocaleString("id-ID")} {item.unit} ×{" "}
                              {formatRupiah(item.unitCost)}
                            </span>
                          </div>
                          <span className="shrink-0 font-mono text-[11px] font-semibold text-brand-dark">
                            {formatRupiah(item.totalCost)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {note.note && (
                      <p className="mt-3 font-sans text-[10px] italic text-brand-text">
                        Catatan: {note.note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Link
          href="/admin/ingredients"
          className="inline-flex items-center gap-2 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-text transition-colors hover:text-brand-dark"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Kembali ke Bahan Baku
        </Link>
      </div>
    </div>
  );
}
