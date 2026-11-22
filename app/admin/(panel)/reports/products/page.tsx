import PageHeading from "@/components/admin/PageHeading";
import { ProductSalesAnalytics } from "@/components/admin/reports/ProductSalesAnalytics";
import { getProductSalesAnalytics } from "@/lib/reports";
import {
  jakartaDateKey,
  monthRangeFromKey,
  isDateKeyValue,
  jakartaMonthKey,
} from "@/lib/order-types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    month?: string;
    from?: string;
    to?: string;
    search?: string;
  }>;
};

export default async function ProductSalesReportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search;

  const hasRange =
    isDateKeyValue(params.from) && isDateKeyValue(params.to);

  let startDate: string | undefined;
  let endDate: string | undefined;

  if (hasRange) {
    startDate = params.from;
    endDate = params.to;
  } else if (params.month) {
    const { start, end } = monthRangeFromKey(params.month);
    startDate = jakartaDateKey(start);
    endDate = jakartaDateKey(new Date(end.getTime() - 1));
  } else {
    const { start, end } = monthRangeFromKey(jakartaMonthKey(new Date()));
    startDate = jakartaDateKey(start);
    endDate = jakartaDateKey(new Date(end.getTime() - 1));
  }

  const { products, totalRevenue, totalQuantity, completedOrdersCount } =
    await getProductSalesAnalytics({
      startDate,
      endDate,
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
          initialFrom={hasRange ? (startDate ?? "") : ""}
          initialTo={hasRange ? (endDate ?? "") : ""}
          initialSearch={search ?? ""}
        />
      </div>
    </>
  );
}
