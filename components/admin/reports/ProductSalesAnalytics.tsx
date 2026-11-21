"Change note: Product sales analytics component with summary cards, bar chart, variant table, and CSV export"
"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/order-types";
import type { ProductSalesSummary } from "@/lib/report-types";
import {
  BarChart3,
  TrendingUp,
  Package,
  ShoppingBag,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ProductSalesAnalyticsProps = {
  products: ProductSalesSummary[];
  totalRevenue: number;
  totalQuantity: number;
  completedOrdersCount: number;
  initialMonth?: string;
  initialSearch?: string;
};

export function ProductSalesAnalytics({
  products,
  totalRevenue,
  totalQuantity,
  completedOrdersCount,
  initialMonth = "",
  initialSearch = "",
}: ProductSalesAnalyticsProps) {
  const [search, setSearch] = useState(initialSearch);
  const [month, setMonth] = useState(initialMonth);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  // Find best seller by quantity and top revenue by product
  let bestSellerName = "—";
  let bestSellerQty = 0;
  let topRevenueName = "—";
  let topRevenueAmount = 0;

  for (const p of products) {
    if (p.totalQuantity > bestSellerQty) {
      bestSellerQty = p.totalQuantity;
      bestSellerName = p.productName;
    }
    if (p.totalRevenue > topRevenueAmount) {
      topRevenueAmount = p.totalRevenue;
      topRevenueName = p.productName;
    }
  }

  const avgQtyPerOrder =
    completedOrdersCount > 0 ? (totalQuantity / completedOrdersCount).toFixed(1) : "0";

  // Filter products by search
  const filteredProducts = products.filter((p) => {
    const s = search.toLowerCase();
    return (
      p.productName.toLowerCase().includes(s) ||
      p.variants.some((v) => v.variantName.toLowerCase().includes(s))
    );
  });

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ["Produk", "Varian", "Harga Satuan", "Qty Terjual", "Total Omzet (IDR)", "Kontribusi Omzet (%)"],
    ];

    for (const p of products) {
      for (const v of p.variants) {
        rows.push([
          `"${p.productName.replace(/"/g, '""')}"`,
          `"${v.variantName.replace(/"/g, '""')}"`,
          String(v.unitPrice),
          String(v.totalQuantity),
          String(v.totalRevenue),
          v.revenueSharePercent.toFixed(2),
        ]);
      }
    }

    const csvContent = rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan-penjualan-produk-${month || "semua"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Metrics Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-stone-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Omzet Produk
            </p>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-700">
            {formatRupiah(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Dari {completedOrdersCount} pesanan selesai
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-xs border border-stone-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Qty Terjual
            </p>
            <div className="rounded-xl bg-stone-100 p-2 text-stone-700">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-stone-900">
            {totalQuantity} <span className="text-sm font-normal text-stone-500">item</span>
          </p>
          <p className="mt-1 text-xs text-stone-500">Rata-rata {avgQtyPerOrder} item / order</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-xs border border-stone-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Produk Terlaris (Qty)
            </p>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-lg font-extrabold text-stone-900 truncate" title={bestSellerName}>
            {bestSellerName}
          </p>
          <p className="mt-1 text-xs text-emerald-700 font-medium">
            {bestSellerQty} terjual
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-xs border border-stone-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Omzet Tertinggi
            </p>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-lg font-extrabold text-stone-900 truncate" title={topRevenueName}>
            {topRevenueName}
          </p>
          <p className="mt-1 text-xs text-amber-700 font-medium">
            {formatRupiah(topRevenueAmount)}
          </p>
        </div>
      </div>

      {/* Filter and Export Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari nama produk / varian..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
            <span className="text-xs text-stone-500">Bulan:</span>
            <input
              type="month"
              value={month}
              onChange={(e) => {
                const m = e.target.value;
                setMonth(m);
                const url = new URL(window.location.href);
                if (m) url.searchParams.set("month", m);
                else url.searchParams.delete("month");
                window.location.href = url.toString();
              }}
              className="bg-transparent font-medium text-stone-800 focus:outline-hidden text-sm"
            />
            {month && (
              <button
                onClick={() => {
                  setMonth("");
                  const url = new URL(window.location.href);
                  url.searchParams.delete("month");
                  window.location.href = url.toString();
                }}
                className="text-xs text-stone-400 hover:text-stone-700 ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-stone-800 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Visual Bar Chart Section */}
      <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-stone-900 mb-1">
          Grafik Kontribusi Omzet Produk
        </h3>
        <p className="text-xs text-stone-500 mb-6">
          Visualisasi persentase omzet dari setiap produk terhadap total penjualan selesai.
        </p>

        {filteredProducts.length === 0 ? (
          <p className="text-center py-8 text-stone-500 text-sm">Tidak ada data produk.</p>
        ) : (
          <div className="space-y-4">
            {filteredProducts.slice(0, 8).map((p) => {
              const maxRev = filteredProducts[0].totalRevenue || 1;
              const barWidth = Math.max(
                4,
                Math.round((p.totalRevenue / maxRev) * 100),
              );

              return (
                <div key={p.productId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-stone-800">{p.productName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-500">
                        {p.totalQuantity} item ({p.revenueSharePercent.toFixed(1)}%)
                      </span>
                      <span className="font-bold text-amber-700">
                        {formatRupiah(p.totalRevenue)}
                      </span>
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-600 transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Product & Variant Breakdown Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
        <div className="border-b border-stone-200 bg-stone-50 px-6 py-4">
          <h3 className="font-bold text-stone-900">Breakdown Detail Per Produk & Varian</h3>
          <p className="text-xs text-stone-500">
            Klik baris produk untuk melihat rincian varian rasa/ukuran.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-700">
            <thead className="bg-stone-50/50 text-xs font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-6 py-3.5">Produk & Varian</th>
                <th className="px-6 py-3.5 text-center">Harga Satuan</th>
                <th className="px-6 py-3.5 text-center">Qty Terjual</th>
                <th className="px-6 py-3.5 text-right">Total Omzet</th>
                <th className="px-6 py-3.5 text-right">Kontribusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                    Tidak ada data penjualan produk.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isExpanded = expandedProduct === p.productId;

                  return (
                    <>
                      {/* Product Header Row */}
                      <tr
                        key={p.productId}
                        onClick={() =>
                          setExpandedProduct(isExpanded ? null : p.productId)
                        }
                        className="cursor-pointer bg-white hover:bg-stone-50 transition-colors font-medium"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-stone-400">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </span>
                            <span className="font-bold text-stone-900 text-base">
                              {p.productName}
                            </span>
                            <span className="rounded-full bg-amber-50 text-amber-800 text-xs px-2 py-0.5 font-normal">
                              {p.variants.length} varian
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-stone-400">—</td>
                        <td className="px-6 py-4 text-center font-bold text-stone-900">
                          {p.totalQuantity} item
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-amber-700">
                          {formatRupiah(p.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-stone-800">
                          {p.revenueSharePercent.toFixed(1)}%
                        </td>
                      </tr>

                      {/* Variant Sub-rows */}
                      {isExpanded &&
                        p.variants.map((v) => (
                          <tr
                            key={v.variantId}
                            className="bg-stone-50/70 border-t border-stone-100 text-xs"
                          >
                            <td className="py-3 pl-12 pr-6">
                              <span className="font-medium text-stone-800">
                                ↳ {v.variantName}
                              </span>
                              {v.priceUnit && (
                                <span className="ml-2 text-stone-400">({v.priceUnit})</span>
                              )}
                            </td>
                            <td className="px-6 py-3 text-center text-stone-600">
                              {formatRupiah(v.unitPrice)}
                            </td>
                            <td className="px-6 py-3 text-center font-medium text-stone-800">
                              {v.totalQuantity} pcs
                            </td>
                            <td className="px-6 py-3 text-right font-medium text-stone-900">
                              {formatRupiah(v.totalRevenue)}
                            </td>
                            <td className="px-6 py-3 text-right text-stone-500">
                              {v.revenueSharePercent.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
