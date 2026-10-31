import type { Metadata } from "next";
import PageHeading from "@/components/admin/PageHeading";
import OrderForm from "@/components/admin/orders/OrderForm";
import { getOrderableProducts, getOrderSources } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Pesanan Baru",
};

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const [catalog, sources] = await Promise.all([
    getOrderableProducts(),
    getOrderSources(),
  ]);

  return (
    <>
      <PageHeading
        eyebrow="Penjualan"
        title="Pesanan Baru"
        accent="catat"
        description="Masukkan pesanan yang masuk lewat WhatsApp atau Instagram. Kode invoice dibuat otomatis setelah disimpan."
      />

      <OrderForm catalog={catalog} sources={sources} />
    </>
  );
}
