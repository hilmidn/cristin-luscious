import PageHeading from "@/components/admin/PageHeading";
import { ProductSalesAnalytics } from "@/components/admin/reports/ProductSalesAnalytics";
import { getProductSalesAnalytics } from "@/lib/reports";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ month?: string; search?: string }>;
};

export default async function ProductSalesReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const month = params.month;
  const search = params.search;

  const { products, totalRevenue, totalQuantity, completedOrdersCount } =
    await getProductSalesAnalytics({
      month,
      search,
    });

  return (
    <>
      <PageHeading
        eyebrow="Penjualan"
        title="Laporan Produk Terlaris"
        accent="& Analytics"
        description="Analisis penjualan produk dan varian berdasarkan pesanan yang telah selesai (SELESAI). Pantau best seller, kontribusi omzet, dan unduh laporan CSV."
      />

      <div className="mt-8">
        <ProductSalesAnalytics
          products={products}
          totalRevenue={totalRevenue}
          totalQuantity={totalQuantity}
          completedOrdersCount={completedOrdersCount}
          initialMonth={month ?? ""}
          initialSearch={search ?? ""}
        />
      </div>
    </>
  );
}
