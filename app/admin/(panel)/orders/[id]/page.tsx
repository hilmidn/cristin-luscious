import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeading from "@/components/admin/PageHeading";
import DeleteOrderButton from "@/components/admin/orders/DeleteOrderButton";
import OrderForm from "@/components/admin/orders/OrderForm";
import OrderStatusControl from "@/components/admin/orders/OrderStatusControl";
import {
  getAdminOrderById,
  getOrderableProducts,
  getOrderCustomers,
  getOrderSources,
} from "@/lib/orders";
import { formatOrderDate, formatRupiah } from "@/lib/order-types";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order = await getAdminOrderById(id);

  return {
    title: order ? `Pesanan ${order.code}` : "Pesanan",
  };
}

export default async function EditOrderPage({ params }: Props) {
  const { id } = await params;

  const [order, catalog, sources, customers] = await Promise.all([
    getAdminOrderById(id),
    getOrderableProducts(),
    getOrderSources(),
    getOrderCustomers(),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <>
      <PageHeading
        eyebrow="Penjualan"
        title={order.code}
        accent="invoice"
        description={`${order.customerName} • ${formatOrderDate(order.createdAt)} • ${formatRupiah(order.total)}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <OrderStatusControl id={order.id} status={order.status} />
            <DeleteOrderButton id={order.id} code={order.code} />
          </div>
        }
      />

      <OrderForm
        order={order}
        catalog={catalog}
        sources={sources}
        customers={customers}
      />
    </>
  );
}
