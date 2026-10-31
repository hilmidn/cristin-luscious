import Link from "next/link";
import { ArrowUpRight, Plus, ShoppingBag } from "lucide-react";
import OrderDetailDialog from "./OrderDetailDialog";
import OrderStatusControl from "./OrderStatusControl";
import {
  SERVICE_LABELS,
  formatDateOnly,
  formatOrderDate,
  formatRupiah,
  type AdminOrder,
} from "@/lib/order-types";

type OrderTableProps = {
  orders: AdminOrder[];
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: {
    href: string;
    label: string;
  };
};

export default function OrderTable({
  orders,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: OrderTableProps) {
  return (
    <>
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
              {emptyTitle}
            </p>
            <p className="mx-auto mt-2 max-w-sm font-sans text-[11px] leading-relaxed text-brand-text">
              {emptyDescription}
            </p>
            {emptyAction && (
              <Link
                href={emptyAction.href}
                className="mt-6 inline-flex items-center gap-2 border border-brand-dark bg-brand-dark px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
              >
                <Plus size={13} />
                {emptyAction.label}
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] border-collapse text-left">
              <thead>
                <tr className="border-b border-brand-border bg-brand-card">
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Kode
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Ambil / Kirim
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
                      <p className="font-mono text-[10px] font-semibold text-brand-dark">
                        {order.code}
                      </p>
                      <p className="mt-1 font-sans text-[9px] text-brand-muted">
                        {formatOrderDate(order.createdAt)}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-middle sm:px-6">
                      <p className="font-sans text-[11px] font-semibold text-brand-dark">
                        {formatDateOnly(order.scheduledAt)}
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
                        {order.items.reduce(
                          (total, item) => total + item.quantity,
                          0,
                        )}
                      </b>{" "}
                      pcs · {order.items.length} varian
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
                      <div className="flex items-center justify-end gap-2">
                        <OrderDetailDialog order={order} />
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-2 border border-brand-border bg-brand-card px-3 py-2 font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-brand-dark transition-colors hover:border-brand-dark"
                        >
                          Edit
                          <ArrowUpRight size={11} />
                        </Link>
                      </div>
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
