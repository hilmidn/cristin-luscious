import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeading from "@/components/admin/PageHeading";
import OrderFilters from "@/components/admin/orders/OrderFilters";
import OrderTable from "@/components/admin/orders/OrderTable";
import {
  getAdminOrders,
  getClosedOrderMonths,
  getOrderSources,
  getRecapStats,
} from "@/lib/orders";
import {
  formatRupiah,
  jakartaMonthKey,
  monthKeyLabel,
  type OrderStatus,
} from "@/lib/order-types";

export const metadata: Metadata = {
  title: "Rekap Pesanan",
};

export const dynamic = "force-dynamic";

/** Pesanan yang sudah tidak berjalan lagi. */
const CLOSED_STATUSES: OrderStatus[] = ["SELESAI", "DIBATALKAN"];

type Props = {
  searchParams: Promise<{
    status?: string;
    source?: string;
    q?: string;
    month?: string;
  }>;
};

export default async function OrderRecapPage({ searchParams }: Props) {
  const params = await searchParams;
  const requestedStatus = CLOSED_STATUSES.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;
  const statuses = requestedStatus ? [requestedStatus] : CLOSED_STATUSES;

  const currentMonth = jakartaMonthKey(new Date());
  const closedMonths = await getClosedOrderMonths();
  // Bulan berjalan selalu ada di pilihan agar filter default tetap terbaca.
  const monthOptions = [...new Set([currentMonth, ...closedMonths])].sort(
    (a, b) => b.localeCompare(a),
  );

  const monthKey =
    params.month === "all"
      ? null
      : monthOptions.includes(params.month ?? "")
        ? (params.month as string)
        : currentMonth;

  const [orders, sources, stats] = await Promise.all([
    getAdminOrders({
      statuses,
      source: params.source?.trim() || undefined,
      q: params.q?.trim() || undefined,
      month: monthKey ?? undefined,
    }),
    getOrderSources(),
    getRecapStats(monthKey),
  ]);

  const periodLabel = monthKey
    ? monthKeyLabel(monthKey)
    : "Semua bulan";

  return (
    <>
      <PageHeading
        eyebrow="Laporan"
        title="Rekap"
        accent="pesanan"
        description="Arsip pesanan yang sudah selesai atau dibatalkan, dikelompokkan per bulan berdasarkan tanggal ambil / kirim. Pesanan aktif tetap di halaman Pesanan."
        actions={
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 border border-brand-border bg-brand-card px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark"
          >
            <ArrowLeft size={13} />
            Pesanan Aktif
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Selesai
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {stats.selesai}
          </p>
          <p className="mt-1 font-sans text-[8px] uppercase tracking-[0.14em] text-brand-muted">
            {periodLabel}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Dibatalkan
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {stats.dibatalkan}
          </p>
          <p className="mt-1 font-sans text-[8px] uppercase tracking-[0.14em] text-brand-muted">
            {periodLabel}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Pendapatan
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {formatRupiah(stats.revenue)}
          </p>
          <p className="mt-1 font-sans text-[8px] uppercase tracking-[0.14em] text-brand-muted">
            Selesai · tgl ambil/kirim
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Nilai Dibatalkan
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {formatRupiah(stats.cancelled)}
          </p>
          <p className="mt-1 font-sans text-[8px] uppercase tracking-[0.14em] text-brand-muted">
            Batal · tgl ambil/kirim
          </p>
        </div>
      </div>

      <OrderFilters
        statuses={CLOSED_STATUSES}
        sources={sources}
        months={monthOptions}
        params={{ ...params, month: monthKey ?? "all" }}
      />

      <OrderTable
        orders={orders}
        emptyTitle={
          monthKey ? `Belum ada pesanan tertutup di ${periodLabel}` : "Belum ada pesanan selesai"
        }
        emptyDescription="Pesanan yang ditandai Selesai atau Dibatalkan akan pindah ke rekap ini."
        emptyAction={{ href: "/admin/orders", label: "Lihat Pesanan Aktif" }}
      />
    </>
  );
}
