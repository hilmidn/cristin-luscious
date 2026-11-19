import PageHeading from "@/components/admin/PageHeading";
import { StockClient } from "@/components/admin/stock/StockClient";
import { getStockOverview } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function AdminStockPage() {
  const stock = await getStockOverview();

  return (
    <>
      <PageHeading
        eyebrow="Katalog"
        title="Stok Jadi"
        accent="Siap Jual"
        description="Barang jadi per varian. Restock tiap batch keluar; otomatis berkurang saat pesanan web diambil hari ini."
      />

      <div className="mt-8">
        <StockClient stock={stock} />
      </div>
    </>
  );
}
