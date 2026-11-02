"Change note: Customer table with search, sorting, and modal trigger"
"use client";

import { useState } from "react";
import { formatRupiah, formatOrderDate } from "@/lib/order-types";
import type { CustomerSummary } from "@/lib/customer-types";
import { CustomerDetailDialog } from "./CustomerDetailDialog";
import { Search, ArrowUpDown, Phone, MapPin, ShoppingBag, Eye, UserPlus } from "lucide-react";
import Link from "next/link";

type CustomerTableProps = {
  customers: CustomerSummary[];
  initialSearch?: string;
  initialSort?: string;
};

export function CustomerTable({
  customers,
  initialSearch = "",
  initialSort = "spent_desc",
}: CustomerTableProps) {
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  // Client-side filtering and sorting for instant responsiveness
  const filtered = customers.filter((c) => {
    const s = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      c.phone.includes(s) ||
      c.address.toLowerCase().includes(s)
    );
  });

  filtered.sort((a, b) => {
    if (sort === "spent_desc") {
      return b.totalSpent - a.totalSpent || b.orderCount - a.orderCount;
    }
    if (sort === "orders_desc") {
      return b.orderCount - a.orderCount || b.totalSpent - a.totalSpent;
    }
    if (sort === "latest_desc") {
      return b.latestOrderAt.getTime() - a.latestOrderAt.getTime();
    }
    return a.name.localeCompare(b.name);
  });

  const totalRevenueAll = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const totalOrdersAll = customers.reduce((acc, c) => acc + c.orderCount, 0);

  return (
    <div>
      {/* Top metrics overview */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-stone-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Total Pelanggan Unik
          </p>
          <p className="mt-1 text-2xl font-extrabold text-stone-900">
            {customers.length} <span className="text-sm font-normal text-stone-500">orang</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-stone-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Total LTV Toko
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">
            {formatRupiah(totalRevenueAll)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-stone-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Total Seluruh Pesanan
          </p>
          <p className="mt-1 text-2xl font-extrabold text-stone-900">
            {totalOrdersAll} <span className="text-sm font-normal text-stone-500">pesanan</span>
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari nama, nomor HP, atau alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
            <ArrowUpDown className="h-4 w-4 text-stone-400" />
            <span className="text-xs text-stone-500">Urutkan:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent font-medium text-stone-800 focus:outline-hidden"
            >
              <option value="spent_desc">LTV Tertinggi</option>
              <option value="orders_desc">Order Terbanyak</option>
              <option value="latest_desc">Order Terbaru</option>
              <option value="name_asc">Nama (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Kontak & Alamat</th>
                <th className="px-6 py-4 text-center">Total Order</th>
                <th className="px-6 py-4 text-right">Lifetime Value (LTV)</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                    Tidak ada pelanggan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => {
                  const newOrderHref = `/admin/orders/new?name=${encodeURIComponent(
                    customer.name,
                  )}&phone=${encodeURIComponent(customer.phone)}&address=${encodeURIComponent(
                    customer.address,
                  )}`;

                  return (
                    <tr key={customer.key} className="hover:bg-stone-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-stone-900">{customer.name}</div>
                        <div className="text-xs text-stone-500">
                          Aktif sejak {formatOrderDate(customer.firstOrderAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-stone-700">
                          <Phone className="h-3.5 w-3.5 text-stone-400" />
                          {customer.phone || "—"}
                        </div>
                        <div className="mt-1 flex items-start gap-1.5 text-xs text-stone-500 max-w-xs truncate">
                          <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0 mt-0.5" />
                          <span className="truncate">{customer.address || "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-800">
                          {customer.orderCount} order
                        </span>
                        {customer.completedOrderCount > 0 && (
                          <div className="mt-0.5 text-[10px] text-emerald-600">
                            {customer.completedOrderCount} selesai
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-amber-700">
                        {formatRupiah(customer.totalSpent)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-xs"
                            title="Lihat riwayat pesanan"
                          >
                            <Eye className="h-3.5 w-3.5 text-stone-500" />
                            Riwayat
                          </button>
                          <Link
                            href={newOrderHref}
                            className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 shadow-xs"
                            title="Buat pesanan baru untuk pelanggan ini"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Order
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerDetailDialog
        customer={selectedCustomer}
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
      />
    </div>
  );
}
