import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import PageHeading from "@/components/admin/PageHeading";
import OrderFilters from "@/components/admin/orders/OrderFilters";
import OrderTable from "@/components/admin/orders/OrderTable";
import {
  getAdminOrders,
  getOrderSources,
  getRecapStats,
} from "@/lib/orders";
import {
  dateKeyLabel,
  formatRupiah,
  isDateKeyValue,
  jakartaDateKey,
  jakartaMonthKey,
  monthRangeFromKey,
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
    from?: string;
    to?: string;
  }>;
};

export default async function OrderRecapPage({ searchParams }: Props) {
  const params = await searchParams;
  const requestedStatus = CLOSED_STATUSES.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;
  const statuses = requestedStatus ? [requestedStatus] : CLOSED_STATUSES;

  // Rentang aktif: from/to; bookmark lama ?month= dipetakan ke rentang bulan.
  const hasRange =
    isDateKeyValue(params.from) && isDateKeyValue(params.to);

  let from: string | undefined;
  let to: string | undefined;

  if (hasRange) {
    from = params.from;
    to = params.to;
  } else if (params.month && params.month !== "all") {
    const { start, end } = monthRangeFromKey(params.month);
    from = jakartaDateKey(start);
    to = jakartaDateKey(new Date(end.getTime() - 1));
  } else {
    const { start, end } = monthRangeFromKey(jakartaMonthKey(new Date()));
    from = jakartaDateKey(start);
    to = jakartaDateKey(new Date(end.getTime() - 1));
  }

  const [orders, sources, stats] = await Promise.all([
    getAdminOrders({
      statuses,
      source: params.source?.trim() || undefined,
      q: params.q?.trim() || undefined,
      from,
      to,
    }),
    getOrderSources(),
    getRecapStats({ from, to }),
  ]);

  const periodLabel = hasRange
    ? from === to
      ? dateKeyLabel(from!)
      : `${dateKeyLabel(from!)} – ${dateKeyLabel(to!)}`
    : "Semua waktu";

  return (
    <>
      <PageHeading
        eyebrow="Laporan"
        title="Rekap"
        accent="pesanan"
        description="Arsip pesanan yang sudah selesai atau dibatalkan, difilter per rentang tanggal ambil / kirim. Pesanan aktif tetap di halaman Pesanan."
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

      <DateRangeFilter
        basePath="/admin/orders/recap"
        initialFrom={hasRange ? (from as string) : ""}
        initialTo={hasRange ? (to as string) : ""}
        preserve={{
          status: requestedStatus,
          source: params.source,
          q: params.q,
        }}
      />

      <OrderFilters
        statuses={CLOSED_STATUSES}
        sources={sources}
        params={{ ...params, month: undefined }}
      />

      <OrderTable
        orders={orders}
        emptyTitle={`Belum ada pesanan tertutup di ${periodLabel}`}
        emptyDescription="Pesanan yang ditandai Selesai atau Dibatalkan akan pindah ke rekap ini."
        emptyAction={{ href: "/admin/orders", label: "Lihat Pesanan Aktif" }}
      />
    </>
  );
}
