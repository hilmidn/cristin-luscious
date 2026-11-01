import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  PackageCheck,
  Plus,
  TrendingUp,
  XCircle,
} from "lucide-react";
import PageHeading from "@/components/admin/PageHeading";
import StatCard from "@/components/admin/StatCard";
import OrderTrendChart from "@/components/admin/orders/OrderTrendChart";
import {
  getAdminOrders,
  getOrderStats,
  getOrderTrend,
  getRecapStats,
} from "@/lib/orders";
import {
  formatDateOnly,
  formatRupiah,
  jakartaMonthKey,
  monthKeyLabel,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/order-types";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES: OrderStatus[] = [
  "BARU",
  "DIPROSES",
  "SELESAI_PRODUKSI",
];

export default async function AdminDashboardPage() {
  const currentMonth = jakartaMonthKey(new Date());

  const [stats, recap, trend, recentOrders] = await Promise.all([
    getOrderStats(),
    getRecapStats(currentMonth),
    getOrderTrend(6),
    getAdminOrders({ statuses: ACTIVE_STATUSES, limit: 5 }),
  ]);

  const activeCount = stats.baru + stats.diproses + stats.selesaiProduksi;

  const cards = [
    {
      label: "Pesanan Aktif",
      value: activeCount,
      hint: `${stats.baru} baru · ${stats.diproses} diproses · ${stats.selesaiProduksi} siap`,
      icon: ClipboardList,
      index: "01",
    },
    {
      label: "Pendapatan Bulan Ini",
      value: formatRupiah(recap.revenue),
      hint: monthKeyLabel(currentMonth),
      icon: TrendingUp,
      index: "02",
    },
    {
      label: "Pesanan Selesai",
      value: recap.selesai,
      hint: "Bulan ini",
      icon: PackageCheck,
      index: "03",
    },
    {
      label: "Nilai Dibatalkan",
      value: formatRupiah(recap.cancelled),
      hint: `${recap.dibatalkan} pesanan batal`,
      icon: XCircle,
      index: "04",
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="Penjualan"
        title="Pesanan"
        accent="ringkasan"
        description="Ringkasan pesanan masuk, pendapatan, dan pembatalan. Angka pendapatan dihitung dari pesanan selesai berdasarkan tanggal ambil / kirim (WIB)."
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-8">
        <OrderTrendChart points={trend} />
      </div>

      <section className="mt-8 border border-brand-border bg-brand-bg">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-brand-border px-5 py-4">
          <div>
            <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.35em] text-brand-text">
              Antrian Kerja
            </span>
            <h2 className="mt-1 font-playfair text-xl font-bold uppercase tracking-tight text-brand-dark">
              Pesanan Terbaru
            </h2>
          </div>

          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 border border-brand-border bg-brand-card px-3 py-2 font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-brand-dark transition-colors hover:border-brand-dark"
          >
            Semua Pesanan
            <ArrowUpRight size={11} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-playfair text-lg font-bold text-brand-dark">
              Belum ada pesanan aktif
            </p>
            <p className="mx-auto mt-2 max-w-sm font-sans text-[11px] leading-relaxed text-brand-text">
              Pesanan baru akan muncul di sini beserta jadwal ambil / kirimnya.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-brand-border bg-brand-card">
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
                    Kode
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
                    Pelanggan
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
                    Jadwal
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-brand-border/70 last:border-b-0 hover:bg-brand-card/60"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-[10px] font-bold text-brand-dark transition-colors hover:text-brand-text"
                      >
                        {order.code}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-sans text-[11px] text-brand-dark">
                      {order.customerName}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-[11px] text-brand-text">
                      {formatDateOnly(order.scheduledAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex border px-1.5 py-0.5 font-sans text-[7px] font-bold uppercase tracking-[0.14em] ${
                          order.status === "BARU"
                            ? "border-brand-dark bg-brand-dark text-brand-bg"
                            : order.status === "SELESAI_PRODUKSI"
                              ? "border-brand-dark bg-brand-bg text-brand-dark"
                              : "border-brand-border bg-brand-card text-brand-text"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-sans text-[11px] text-brand-dark">
                      {formatRupiah(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 font-sans text-[9px] uppercase tracking-[0.18em] text-brand-muted">
        Statistik memakai zona waktu WIB dan tanggal ambil / kirim pesanan.
      </p>
    </>
  );
}
