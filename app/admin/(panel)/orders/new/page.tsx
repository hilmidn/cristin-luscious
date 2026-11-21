import type { Metadata } from "next";
import PageHeading from "@/components/admin/PageHeading";
import OrderForm from "@/components/admin/orders/OrderForm";
import { getOrderableProducts, getOrderCustomers, getOrderSources } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Pesanan Baru",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ name?: string; phone?: string; address?: string }>;
};

export default async function NewOrderPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [catalog, sources, customers] = await Promise.all([
    getOrderableProducts(),
    getOrderSources(),
    getOrderCustomers(),
  ]);

  return (
    <>
      <PageHeading
        eyebrow="Penjualan"
        title="Pesanan Baru"
        accent="catat"
        description="Masukkan pesanan yang masuk lewat WhatsApp atau Instagram. Kode invoice dibuat otomatis setelah disimpan."
      />

      <OrderForm
        catalog={catalog}
        sources={sources}
        customers={customers}
        initialCustomer={{
          name: params.name ?? "",
          phone: params.phone ?? "",
          address: params.address ?? "",
        }}
      />
    </>
  );
}
