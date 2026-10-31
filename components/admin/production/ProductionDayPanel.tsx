import Link from "next/link";
import { ArrowUpRight, MapPin, MessageCircle, Truck } from "lucide-react";
import ProductionStageStepper from "./ProductionStageStepper";
import { SERVICE_LABELS } from "@/lib/order-types";
import { formatDayLabel, type ProductionDay } from "@/lib/production-types";

type ProductionDayPanelProps = {
  day: ProductionDay;
};

/** Nomor HP 08xx -> 628xx untuk tautan WhatsApp. */
function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");

  return `https://wa.me/${digits.startsWith("0") ? `62${digits.slice(1)}` : digits}`;
}

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
          {String(day.orderCount).padStart(2, "0")} pesanan ·{" "}
          {String(day.itemCount).padStart(2, "0")} item
        </span>
      </div>

      {day.orders.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="font-playfair text-lg font-bold text-brand-dark">
            Tidak ada produksi
          </p>
          <p className="mx-auto mt-2 max-w-sm font-sans text-[11px] leading-relaxed text-brand-text">
            Belum ada pesanan aktif dengan tanggal ambil / kirim di hari ini.
            Pilih tanggal lain di kalender.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-brand-border">
          {day.orders.map((order) => (
            <article key={order.orderId} className="px-5 py-4">
              <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold tracking-wide text-brand-dark">
                      {order.code}
                    </span>
                    <span className="inline-flex items-center gap-1 border border-brand-border bg-brand-card px-1.5 py-0.5 font-sans text-[7px] font-bold uppercase tracking-[0.14em] text-brand-text">
                      {order.serviceType === "ANTAR" ? (
                        <Truck size={9} />
                      ) : (
                        <MapPin size={9} />
                      )}
                      {SERVICE_LABELS[order.serviceType]}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-sans text-[11px] text-brand-dark">
                    {order.customerName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={whatsappHref(order.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 border border-brand-border bg-brand-card px-2 py-1.5 font-sans text-[8px] font-bold uppercase tracking-[0.14em] text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark"
                  >
                    <MessageCircle size={10} />
                    {order.phone}
                  </a>
                  <Link
                    href={`/admin/orders/${order.orderId}`}
                    className="inline-flex items-center gap-1 border border-brand-border bg-brand-bg px-2 py-1.5 font-sans text-[8px] font-bold uppercase tracking-[0.14em] text-brand-dark transition-colors hover:border-brand-dark"
                  >
                    Pesanan
                    <ArrowUpRight size={10} />
                  </Link>
                </div>
              </header>

              <ul className="space-y-1">
                {order.items.map((item) => (
                  <li
                    key={item.taskId}
                    className="grid grid-cols-1 gap-2 border border-brand-border/70 bg-brand-card/40 px-3 py-2 sm:grid-cols-[1fr_260px] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-sans text-[11px] font-semibold text-brand-dark">
                        {item.productName}
                        <span className="font-normal text-brand-text">
                          {" "}
                          — {item.variantName}
                        </span>
                      </p>
                      <p className="mt-0.5 font-mono text-[9px] text-brand-text">
                        ×{item.quantity}
                      </p>
                    </div>

                    <ProductionStageStepper
                      taskId={item.taskId}
                      stage={item.stage}
                    />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
