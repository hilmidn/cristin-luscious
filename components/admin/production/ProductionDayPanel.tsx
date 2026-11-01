import ProductionStageStepper from "./ProductionStageStepper";
import { formatDayLabel, type ProductionDay } from "@/lib/production-types";

type ProductionDayPanelProps = {
  day: ProductionDay;
};

export default function ProductionDayPanel({ day }: ProductionDayPanelProps) {
  return (
    <section className="border border-brand-border bg-brand-bg">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-brand-border px-5 py-4">
        <div>
          <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.35em] text-brand-text">
            Jadwal Produksi
          </span>
          <h2 className="mt-1 font-playfair text-xl font-bold uppercase tracking-tight text-brand-dark">
            {formatDayLabel(day.dateKey)}
          </h2>
        </div>

        <span className="font-mono text-[9px] text-brand-muted">
          {String(day.groups.length).padStart(2, "0")} produk ·{" "}
          {String(day.itemCount).padStart(2, "0")} item
        </span>
      </div>

      {day.groups.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="font-playfair text-lg font-bold text-brand-dark">
            Tidak ada produksi
          </p>
          <p className="mx-auto mt-2 max-w-sm font-sans text-[11px] leading-relaxed text-brand-text">
            Belum ada produk yang dijadwalkan untuk tanggal ini. Pilih tanggal
            lain di kalender.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-brand-border">
          {day.groups.map((group) => (
            <article key={group.key} className="px-5 py-4">
              <header className="mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <p className="font-sans text-[13px] font-semibold leading-snug text-brand-dark">
                    {group.productName}
                  </p>
                  <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-brand-text">
                    {group.orderCount} pesanan · {group.quantity} total
                  </p>
                </div>

                <span className="shrink-0 font-mono text-[13px] font-bold text-brand-dark">
                  ×{group.quantity}
                </span>
              </header>

              <ul className="mb-3 divide-y divide-brand-border/70 border-y border-brand-border/70">
                {group.variants.map((variant) => (
                  <li
                    key={variant.key}
                    className="flex items-center justify-between gap-3 py-2 font-sans text-[11px]"
                  >
                    <span className="text-brand-text">
                      {variant.variantName ?? "Tanpa varian"}
                    </span>
                    <span className="shrink-0 font-mono font-semibold text-brand-dark">
                      ×{variant.quantity}
                    </span>
                  </li>
                ))}
              </ul>

              <ProductionStageStepper
                taskIds={group.taskIds}
                stage={group.stage}
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
