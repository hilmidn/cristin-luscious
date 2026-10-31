import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Plus, ShoppingBag } from "lucide-react";
import PageHeading from "@/components/admin/PageHeading";
import OrderStatusControl from "@/components/admin/orders/OrderStatusControl";
import { getAdminOrders, getOrderSources, getOrderStats } from "@/lib/orders";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  SERVICE_LABELS,
  formatOrderDate,
  formatRupiah,
  type OrderStatus,
} from "@/lib/order-types";

export const metadata: Metadata = {
  title: "Pesanan",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    status?: string;
    source?: string;
    q?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeStatus = ORDER_STATUSES.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;
  const activeSource = params.source?.trim() || undefined;
  const query = params.q?.trim() || undefined;

  const [orders, sources, stats] = await Promise.all([
    getAdminOrders({ status: activeStatus, source: activeSource, q: query }),
    getOrderSources(),
    getOrderStats(),
  ]);

  return (
    <>
      <PageHeading
        eyebrow="Penjualan"
        title="Pesanan"
        accent="invoice"
        description="Catat pesanan dari WhatsApp atau Instagram: beberapa varian dalam satu order, layanan pickup/antar, ongkir, dan kode invoice otomatis."
        actions={
          <Link
            href="/admin/orders/new"
            className="inline-flex items-center gap-2 border border-brand-dark bg-brand-dark px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
          >
            <Plus size={14} />
            Tambah Pesanan
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Total Pesanan
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {stats.total}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Perlu Dikerjakan
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {stats.baru + stats.diproses}
          </p>
          <p className="mt-1 font-sans text-[9px] text-brand-muted">
            {stats.baru} baru · {stats.diproses} diproses
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Nilai Bulan Ini
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {formatRupiah(stats.monthRevenue)}
          </p>
        </div>
      </div>

      <form
        method="get"
        className="mb-6 grid grid-cols-1 gap-3 border border-brand-border bg-brand-card/40 p-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
      >
        <select
          name="status"
          defaultValue={params.status ?? ""}
          aria-label="Filter status"
          className="border border-brand-border bg-brand-bg px-3 py-2.5 font-sans text-[10px] text-brand-dark outline-none focus:border-brand-dark"
        >
          <option value="">Semua status</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>

        <select
          name="source"
          defaultValue={params.source ?? ""}
          aria-label="Filter sumber"
          className="border border-brand-border bg-brand-bg px-3 py-2.5 font-sans text-[10px] text-brand-dark outline-none focus:border-brand-dark"
        >
          <option value="">Semua sumber</option>
          {sources.map((option) => (
            <option key={option.source} value={option.source}>
              {option.source} ({option.count})
            </option>
          ))}
        </select>

        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Cari kode, nama, atau no. HP"
          aria-label="Cari pesanan"
          className="border border-brand-border bg-brand-bg px-3 py-2.5 font-sans text-[10px] text-brand-dark outline-none placeholder:text-brand-muted focus:border-brand-dark"
        />

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 border border-brand-dark bg-brand-dark px-5 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
        >
          Terapkan
        </button>
      </form>

      <section className="border border-brand-border bg-brand-bg">
        <div className="flex items-end justify-between gap-4 border-b border-brand-border px-5 py-4 sm:px-6">
          <div>
            <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.35em] text-brand-text">
              Daftar Pesanan
            </span>
            <h2 className="mt-1 font-playfair text-xl font-bold uppercase tracking-tight text-brand-dark">
              Invoice &amp; Pengiriman
            </h2>
          </div>
          <span className="font-mono text-[9px] text-brand-muted">
            {String(orders.length).padStart(2, "0")} pesanan
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ShoppingBag
              size={22}
              strokeWidth={1.4}
              className="mx-auto text-brand-muted"
            />
            <p className="mt-4 font-playfair text-xl font-bold text-brand-dark">
              Belum ada pesanan
            </p>
            <p className="mx-auto mt-2 max-w-sm font-sans text-[11px] leading-relaxed text-brand-text">
              Pesanan yang dicatat di sini tidak perlu membuat akun pelanggan.
              Setelah disimpan, kode invoice dibuat otomatis.
            </p>
            <Link
              href="/admin/orders/new"
              className="mt-6 inline-flex items-center gap-2 border border-brand-dark bg-brand-dark px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
            >
              <Plus size={13} />
              Catat Pesanan Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-brand-border bg-brand-card">
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Kode
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Pelanggan
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Layanan
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Item
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Total
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Sumber
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-brand-border/70 transition-colors last:border-b-0 hover:bg-brand-card/60"
                  >
                    <td className="px-5 py-4 align-middle sm:px-6">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-[10px] font-semibold text-brand-dark transition-colors hover:text-brand-text"
                      >
                        {order.code}
                      </Link>
                      <p className="mt-1 font-sans text-[9px] text-brand-muted">
                        {formatOrderDate(order.createdAt)}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-middle sm:px-6">
                      <p className="font-playfair text-sm font-bold tracking-wide text-brand-dark">
                        {order.customerName}
                      </p>
                      <p className="mt-0.5 font-mono text-[9px] text-brand-muted">
                        {order.phone}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-middle font-sans text-[11px] text-brand-text sm:px-6">
                      {SERVICE_LABELS[order.serviceType]}
                    </td>

                    <td className="px-5 py-4 align-middle font-sans text-[11px] text-brand-text sm:px-6">
                      <b className="font-semibold text-brand-dark">
                        {order.unitCount}
                      </b>{" "}
                      pcs · {order.itemCount} varian
                    </td>

                    <td className="px-5 py-4 align-middle font-sans text-[11px] font-semibold text-brand-dark sm:px-6">
                      {formatRupiah(order.total)}
                    </td>

                    <td className="px-5 py-4 align-middle font-sans text-[10px] text-brand-text sm:px-6">
                      {order.source ?? "—"}
                    </td>

                    <td className="px-5 py-4 align-middle sm:px-6">
                      <OrderStatusControl
                        id={order.id}
                        status={order.status}
                      />
                    </td>

                    <td className="px-5 py-4 align-middle text-right sm:px-6">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-2 border border-brand-border bg-brand-card px-3 py-2 font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-brand-dark transition-colors hover:border-brand-dark"
                      >
                        Detail
                        <ArrowUpRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 font-sans text-[9px] uppercase tracking-[0.18em] text-brand-muted">
        Total dihitung server dari harga varian saat pesanan disimpan.
      </p>
    </>
  );
}
