"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { formatPrice } from "@/lib/catalog-types";
import {
  ORDER_STATUS_LABELS,
  SERVICE_LABELS,
  formatDateOnly,
  formatOrderDate,
  formatRupiah,
  type AdminOrder,
} from "@/lib/order-types";

type OrderDetailDialogProps = {
  order: AdminOrder;
};

const statusClass: Record<AdminOrder["status"], string> = {
  BARU: "border-brand-dark bg-brand-dark text-brand-bg",
  DIPROSES: "border-brand-border bg-brand-card text-brand-dark",
  SELESAI: "border-brand-border bg-brand-bg text-brand-text",
  DIBATALKAN: "border-brand-border bg-brand-bg text-brand-muted",
};

const labelClass =
  "mb-1 block font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text";

const valueClass =
  "font-sans text-[11px] leading-relaxed text-brand-dark";

export default function OrderDetailDialog({ order }: OrderDetailDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const unitCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-brand-border bg-brand-card px-3 py-2 font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-brand-dark transition-colors hover:border-brand-dark"
      >
        Detail
        <ArrowUpRight size={11} />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-brand-dark/40 p-4 backdrop-blur-sm sm:p-8"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Detail pesanan ${order.code}`}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-2xl border border-brand-border bg-brand-bg"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-brand-border px-5 py-4 sm:px-6">
                <div>
                  <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.35em] text-brand-text">
                    Invoice
                  </span>
                  <h2 className="mt-1 font-playfair text-xl font-bold tracking-tight text-brand-dark">
                    {order.code}
                  </h2>
                  <p className="mt-1 font-sans text-[10px] text-brand-muted">
                    {formatOrderDate(order.createdAt)} ·{" "}
                    {SERVICE_LABELS[order.serviceType]}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`border px-2.5 py-1 font-sans text-[8px] font-bold uppercase tracking-[0.18em] ${statusClass[order.status]}`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Tutup detail pesanan"
                    className="p-1.5 text-brand-text transition-colors hover:text-brand-dark"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="max-h-[65vh] space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <span className={labelClass}>Nama</span>
                    <p className={valueClass}>{order.customerName}</p>
                  </div>

                  <div>
                    <span className={labelClass}>No. HP</span>
                    <p className={valueClass}>{order.phone}</p>
                  </div>

                  <div className="sm:col-span-2">
                    <span className={labelClass}>Alamat</span>
                    <p className={`${valueClass} whitespace-pre-line`}>
                      {order.address}
                    </p>
                  </div>

                  <div>
                    <span className={labelClass}>Tanggal Ambil / Kirim</span>
                    <p className={valueClass}>
                      {formatDateOnly(order.scheduledAt)}
                    </p>
                  </div>

                  {order.serviceType === "ANTAR" && (
                    <div className="sm:col-span-2 border border-brand-border bg-brand-card p-3">
                      <span className={labelClass}>Titik Lokasi Pengantaran</span>
                      <p className={`${valueClass} whitespace-pre-line`}>
                        {order.deliveryPoint ?? "—"}
                      </p>
                      {order.deliveryMapUrl && (
                        <a
                          href={order.deliveryMapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 font-sans text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-text underline-offset-4 transition-colors hover:text-brand-dark hover:underline"
                        >
                          Buka di Google Maps
                          <ArrowUpRight size={11} />
                        </a>
                      )}
                    </div>
                  )}

                  <div>
                    <span className={labelClass}>Sumber</span>
                    <p className={valueClass}>{order.source ?? "—"}</p>
                  </div>

                  <div>
                    <span className={labelClass}>Jumlah</span>
                    <p className={valueClass}>
                      {unitCount} pcs · {order.items.length} varian
                    </p>
                  </div>

                  {order.note && (
                    <div className="sm:col-span-2">
                      <span className={labelClass}>Catatan</span>
                      <p className={`${valueClass} whitespace-pre-line`}>
                        {order.note}
                      </p>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div>
                  <span className={labelClass}>Item Pesanan</span>
                  <div className="mt-2 border border-brand-border">
                    {order.items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                          index > 0 ? "border-t border-brand-border/70" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-playfair text-[13px] font-bold tracking-wide text-brand-dark">
                            {item.productName}
                          </p>
                          <p className="mt-0.5 font-sans text-[10px] text-brand-text">
                            {item.variantName} ·{" "}
                            {formatPrice(item.unitPrice, item.priceUnit) ??
                              "Harga menyusul"}{" "}
                            × {item.quantity}
                          </p>
                        </div>
                        <span className="shrink-0 font-sans text-[11px] font-semibold text-brand-dark">
                          {formatRupiah(item.lineTotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <dl className="space-y-2 border-t border-brand-border pt-4 font-sans text-[11px]">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-brand-text">Subtotal</dt>
                    <dd className="text-brand-dark">
                      {formatRupiah(order.subtotal)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-brand-text">Ongkir</dt>
                    <dd className="text-brand-dark">
                      {formatRupiah(order.shippingCost)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-brand-border pt-3">
                    <dt className="font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
                      Total
                    </dt>
                    <dd className="font-playfair text-lg font-bold text-brand-dark">
                      {formatRupiah(order.total)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Footer */}
              <div className="flex flex-col gap-3 border-t border-brand-border px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center border border-brand-border bg-brand-card px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark"
                >
                  Tutup
                </button>

                <Link
                  href={`/admin/orders/${order.id}`}
                  className="inline-flex items-center justify-center gap-2 border border-brand-dark bg-brand-dark px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
                >
                  Edit Pesanan
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
