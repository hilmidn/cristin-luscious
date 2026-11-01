import { formatPrice } from "@/lib/catalog-types";
import {
  JAKARTA_TIME_ZONE,
  SERVICE_LABELS,
  formatDateOnly,
  formatOrderDate,
  formatRupiah,
  type AdminOrder,
} from "@/lib/order-types";

type OrderReceiptProps = {
  order: AdminOrder;
};

const labelClass =
  "block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-brand-text";

function priceText(unitPrice: number | null, priceUnit: string | null) {
  return formatPrice(unitPrice, priceUnit) ?? "Harga menyusul";
}

/**
 * Nota pesanan untuk diunduh sebagai gambar. Lebar tetap 640px dan tinggi
 * mengikuti isi, jadi seluruh data selalu muat tanpa terpotong.
 */
export default function OrderReceipt({ order }: OrderReceiptProps) {
  const printedAt = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: JAKARTA_TIME_ZONE,
  }).format(new Date());

  return (
    <div className="w-[640px] border border-brand-border bg-brand-bg px-10 py-7 font-sans text-brand-dark">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Cristin Luscious"
          width={383}
          height={187}
          className="h-[64px] w-auto"
        />
        <p className="mt-2 font-sans text-[10px] font-bold uppercase tracking-[0.32em] text-brand-text">
          Luscious Cookies &amp; Dessert
        </p>
      </div>

      <div className="my-5 border-t border-brand-border" />

      {/* Invoice */}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <span className={labelClass}>Nota Pesanan</span>
          <p className="mt-1 font-mono text-[24px] font-bold tracking-[0.06em] text-brand-dark">
            {order.code}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.24em] text-brand-dark">
            {SERVICE_LABELS[order.serviceType]}
          </p>
        </div>
      </div>

      {/* Customer & detail */}
      <div className="mt-5 grid grid-cols-2 gap-6">
        <div className="min-w-0">
          <span className={labelClass}>Customer</span>
          <p className="mt-1 font-sans text-[14px] font-semibold leading-snug text-brand-dark">
            {order.customerName}
          </p>
          <p className="mt-1 font-sans text-[12px] text-brand-text">
            {order.phone.slice(0, 5)}*****
          </p>
        </div>

        <div className="min-w-0">
          <span className={labelClass}>Rincian</span>
          <dl className="mt-1 space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="font-sans text-[10px] uppercase tracking-[0.1em] text-brand-text">
                Tanggal pesanan
              </dt>
              <dd className="shrink-0 font-sans text-[11px] text-brand-dark">
                {formatOrderDate(order.createdAt)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="font-sans text-[10px] uppercase tracking-[0.1em] text-brand-text">
                Jadwal
              </dt>
              <dd className="shrink-0 font-sans text-[11px] text-brand-dark">
                {formatDateOnly(order.scheduledAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Items */}
      <div className="mt-6">
        <div className="flex items-end justify-between gap-4 border-b border-brand-border pb-1.5">
          <span className={labelClass}>Item</span>
          <div className="flex shrink-0 items-end gap-4">
            <span className="w-8 text-right font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-brand-text">
              Qty
            </span>
            <span className="w-[104px] text-right font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-brand-text">
              Total
            </span>
          </div>
        </div>

        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4 border-b border-brand-border/60 py-2"
          >
            <div className="min-w-0">
              <p className="font-sans text-[13px] font-semibold leading-snug text-brand-dark">
                {item.productName}
              </p>
              <p className="mt-0.5 font-sans text-[11px] text-brand-text">
                {item.variantName} · {priceText(item.unitPrice, item.priceUnit)}
              </p>
            </div>

            <div className="flex shrink-0 items-baseline gap-4">
              <span className="w-8 text-right font-mono text-[11px] text-brand-text">
                ×{item.quantity}
              </span>
              <span className="w-[104px] text-right font-sans text-[12px] font-semibold text-brand-dark">
                {item.unitPrice === null ? "—" : formatRupiah(item.lineTotal)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="ml-auto mt-4 w-[300px]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-sans text-[12px] text-brand-text">
            Subtotal
          </span>
          <span className="font-sans text-[12px] text-brand-dark">
            {formatRupiah(order.subtotal)}
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <span className="font-sans text-[12px] text-brand-text">Ongkir</span>
          <span className="font-sans text-[12px] text-brand-dark">
            {formatRupiah(order.shippingCost)}
          </span>
        </div>

        <div className="mt-2 flex items-baseline justify-between gap-3 border-t-2 border-brand-dark pt-2">
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-brand-dark">
            Total
          </span>
          <span className="font-sans text-[22px] font-bold tracking-tight text-brand-dark">
            {formatRupiah(order.total)}
          </span>
        </div>
      </div>

      {/* Delivery & note */}
      {(order.note ||
        (order.serviceType === "ANTAR" && order.deliveryPoint)) && (
        <div className="mt-5 space-y-2">
          {order.serviceType === "ANTAR" && order.deliveryPoint && (
            <div className="border border-brand-border bg-brand-card px-3 py-2">
              <span className={labelClass}>Alamat Pengantaran</span>
              <p className="mt-1 whitespace-pre-line font-sans text-[12px] leading-snug text-brand-dark">
                {order.deliveryPoint}
              </p>
            </div>
          )}

          {order.note && (
            <div>
              <span className={labelClass}>Catatan</span>
              <p className="mt-1 whitespace-pre-line font-sans text-[12px] leading-snug text-brand-text">
                {order.note}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 border-t border-brand-border pt-4 text-center">
        <p className="font-script text-[30px] leading-none text-brand-dark">
          Terima kasih
        </p>
        <p className="mt-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text">
          {"Cristin's Luscious · Cookies & Dessert"}
        </p>
        <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.12em] text-brand-muted">
          Dicetak {printedAt} WIB
        </p>
      </div>
    </div>
  );
}
