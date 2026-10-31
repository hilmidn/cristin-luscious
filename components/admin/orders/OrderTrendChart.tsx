import { formatRupiah } from "@/lib/order-types";
import type { OrderTrendPoint } from "@/lib/orders";

type OrderTrendChartProps = {
  points: OrderTrendPoint[];
};

/** Angka ringkas untuk label di bawah bar, mis. 1,5jt / 250rb. */
function compactRupiah(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })}jt`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}rb`;
  }

  return String(value);
}

export default function OrderTrendChart({ points }: OrderTrendChartProps) {
  const max = Math.max(
    1,
    ...points.map((point) => Math.max(point.revenue, point.cancelled)),
  );

  return (
    <section className="border border-brand-border bg-brand-bg">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-brand-border px-5 py-4">
        <div>
          <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.35em] text-brand-text">
            Tren
          </span>
          <h2 className="mt-1 font-playfair text-xl font-bold uppercase tracking-tight text-brand-dark">
            Pendapatan &amp; Pembatalan
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2 font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-brand-text">
            <span className="h-2.5 w-2.5 bg-brand-dark" />
            Pendapatan
          </span>
          <span className="inline-flex items-center gap-2 font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-brand-text">
            <span className="h-2.5 w-2.5 bg-brand-muted" />
            Dibatalkan
          </span>
        </div>
      </div>

      <div className="px-4 pb-4 pt-6 sm:px-6">
        <div className="flex items-end gap-2 sm:gap-5">
          {points.map((point) => {
            const revenueHeight = (point.revenue / max) * 100;
            const cancelledHeight = (point.cancelled / max) * 100;

            return (
              <div key={point.monthKey} className="flex min-w-0 flex-1 flex-col">
                <div className="flex h-[140px] items-end justify-center gap-1 sm:gap-2">
                  <div
                    role="img"
                    aria-label={`Pendapatan ${point.label}: ${formatRupiah(point.revenue)} dari ${point.selesai} pesanan selesai`}
                    title={`Pendapatan ${point.label}: ${formatRupiah(point.revenue)} (${point.selesai} pesanan)`}
                    style={{
                      height: `${revenueHeight}%`,
                      minHeight: point.revenue > 0 ? 6 : 2,
                    }}
                    className={`w-3.5 sm:w-6 ${
                      point.revenue > 0 ? "bg-brand-dark" : "bg-brand-border"
                    }`}
                  />
                  <div
                    role="img"
                    aria-label={`Dibatalkan ${point.label}: ${formatRupiah(point.cancelled)} dari ${point.dibatalkan} pesanan batal`}
                    title={`Dibatalkan ${point.label}: ${formatRupiah(point.cancelled)} (${point.dibatalkan} pesanan)`}
                    style={{
                      height: `${cancelledHeight}%`,
                      minHeight: point.cancelled > 0 ? 6 : 2,
                    }}
                    className={`w-3.5 sm:w-6 ${
                      point.cancelled > 0 ? "bg-brand-muted" : "bg-brand-border"
                    }`}
                  />
                </div>

                <span className="mt-2 truncate text-center font-sans text-[8px] font-bold uppercase tracking-[0.12em] text-brand-text">
                  {point.shortLabel}
                </span>
                <span className="hidden text-center font-mono text-[8px] text-brand-muted sm:block">
                  {compactRupiah(point.revenue)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
