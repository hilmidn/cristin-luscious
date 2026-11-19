import PageFlow from "@/components/OrderFlow";
import { getPublishedProducts } from "@/lib/catalog";
import { getPublishedVariantStockMap } from "@/lib/stock";
import { jakartaDateKey } from "@/lib/order-types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pesan Online | Cristins Luscious",
  description:
    "Pesan cheesecake, cookies, dan dessert favoritmu — ambil langsung di toko.",
};

export default async function OrderPage() {
  const [products, stockMap] = await Promise.all([
    getPublishedProducts(),
    getPublishedVariantStockMap(),
  ]);

  return (
    <PageFlow
      products={products}
      stock={stockMap}
      today={jakartaDateKey(new Date())}
    />
  );
}
