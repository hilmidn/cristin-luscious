import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import PageHeading from "@/components/admin/PageHeading";
import OrderFilters from "@/components/admin/orders/OrderFilters";
import OrderTable from "@/components/admin/orders/OrderTable";
import { getAdminOrders, getOrderSources, getOrderStats } from "@/lib/orders";
import { type OrderStatus } from "@/lib/order-types";

export const metadata: Metadata = {
  title: "Pesanan",
};

export const dynamic = "force-dynamic";

/** Pesanan yang masih perlu dikerjakan. Sisanya ada di halaman Rekap. */
const ACTIVE_STATUSES: OrderStatus[] = [
  "BARU",
  "DIPROSES",
  "SELESAI_PRODUKSI",
];

type Props = {
  searchParams: Promise<{
    status?: string;
    source?: string;
    q?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const requestedStatus = ACTIVE_STATUSES.includes(params.status as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;
  const statuses = requestedStatus ? [requestedStatus] : ACTIVE_STATUSES;

  const [orders, sources, stats] = await Promise.all([
    getAdminOrders({
      statuses,
      source: params.source?.trim() || undefined,
      q: params.q?.trim() || undefined,
    }),
    getOrderSources(),
    getOrderStats(),
  ]);

  const activeCount = stats.baru + stats.diproses + stats.selesaiProduksi;

  return (
    <>
      <PageHeading
        eyebrow="Penjualan"
        title="Pesanan"
        accent="aktif"
        description="Pesanan yang sedang berjalan: baru masuk, diproses, atau selesai produksi. Pesanan yang sudah selesai atau dibatalkan ada di Rekap Pesanan."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/orders/recap"
              className="inline-flex items-center gap-2 border border-brand-border bg-brand-card px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark"
            >
              Rekap Pesanan
              <ArrowUpRight size={13} />
            </Link>

            <Link
              href="/admin/orders/new"
              className="inline-flex items-center gap-2 border border-brand-dark bg-brand-dark px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
            >
              <Plus size={14} />
              Tambah Pesanan
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Pesanan Aktif
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {activeCount}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Baru Masuk
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {stats.baru}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Sedang Diproses
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {stats.diproses}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Selesai Produksi
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {stats.selesaiProduksi}
          </p>
        </div>
      </div>

      <OrderFilters statuses={ACTIVE_STATUSES} sources={sources} params={params} />

      <OrderTable
        orders={orders}
        emptyTitle="Tidak ada pesanan aktif"
        emptyDescription="Semua pesanan sudah selesai. Pesanan baru yang dicatat akan muncul di sini."
        emptyAction={{ href: "/admin/orders/new", label: "Catat Pesanan" }}
      />
    </>
  );
}
