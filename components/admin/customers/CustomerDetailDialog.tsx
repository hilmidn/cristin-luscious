"Change note: Customer detail modal with order history and new order shortcut"
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRupiah, formatOrderDate } from "@/lib/order-types";
import type { CustomerSummary } from "@/lib/customer-types";
import { ShoppingBag, Phone, MapPin, Calendar, ExternalLink, X } from "lucide-react";

type CustomerDetailDialogProps = {
  customer: CustomerSummary | null;
  isOpen: boolean;
  onClose: () => void;
};

export function CustomerDetailDialog({
  customer,
  isOpen,
  onClose,
}: CustomerDetailDialogProps) {
  if (!isOpen || !customer) return null;

  const newOrderHref = `/admin/orders/new?name=${encodeURIComponent(
    customer.name,
  )}&phone=${encodeURIComponent(customer.phone)}&address=${encodeURIComponent(
    customer.address,
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-stone-900">{customer.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-stone-600">
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-amber-600" />
                {customer.phone || "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-amber-600" />
                {customer.address || "—"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-amber-50/60 p-4 border border-amber-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Customer Lifetime Value (LTV)
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-950">
              {formatRupiah(customer.totalSpent)}
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Dari {customer.completedOrderCount} pesanan selesai
            </p>
          </div>
          <div className="rounded-xl bg-stone-50 p-4 border border-stone-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Pesanan
            </p>
            <p className="mt-1 text-2xl font-bold text-stone-900">
              {customer.orderCount} <span className="text-sm font-normal text-stone-500">kali</span>
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              Termasuk dibatalkan / diproses
            </p>
          </div>
          <div className="rounded-xl bg-stone-50 p-4 border border-stone-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Pelanggan Sejak
            </p>
            <p className="mt-1 text-lg font-bold text-stone-900">
              {formatOrderDate(customer.firstOrderAt)}
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              Terakhir: {formatOrderDate(customer.latestOrderAt)}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-6 flex items-center justify-between">
          <h4 className="font-semibold text-stone-800">Riwayat Pesanan ({customer.orders.length})</h4>
          <Link
            href={newOrderHref}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            Buat Pesanan Baru untuk Pelanggan Ini
          </Link>
        </div>

        {/* Orders list */}
        <div className="mt-4 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
          {customer.orders.map((order) => (
            <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-stone-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-700">{order.code}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    order.status === "SELESAI" ? "bg-emerald-100 text-emerald-800" :
                    order.status === "DIBATALKAN" ? "bg-red-100 text-red-800" :
                    "bg-amber-100 text-amber-800"
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-stone-500 flex items-center gap-3">
                  <span>📅 {formatOrderDate(order.createdAt)}</span>
                  <span>📦 {order.items.length} item</span>
                  <span>🚚 {order.serviceType}</span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <span className="font-bold text-stone-900">{formatRupiah(order.total)}</span>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                >
                  Detail
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
