import "server-only";

import { getAdminOrders } from "./orders";
import type {
  ProductSalesSummary,
  VariantSalesSummary,
  SalesReportFilter,
} from "./report-types";

export async function getProductSalesAnalytics(
  filter: SalesReportFilter = {},
): Promise<{
  products: ProductSalesSummary[];
  totalRevenue: number;
  totalQuantity: number;
  completedOrdersCount: number;
}> {
  const orders = await getAdminOrders();

  // Only consider completed orders ("SELESAI") for accurate financial and sales reports
  const completedOrders = orders.filter((o) => o.status === "SELESAI");

  // Date filtering
  const filteredOrders = completedOrders.filter((order) => {
    const orderDateStr = order.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
    const orderMonthStr = orderDateStr.slice(0, 7); // YYYY-MM

    if (filter.month && orderMonthStr !== filter.month) {
      return false;
    }
    if (filter.startDate && orderDateStr < filter.startDate) {
      return false;
    }
    if (filter.endDate && orderDateStr > filter.endDate) {
      return false;
    }
    return true;
  });

  const variantMap = new Map<string, VariantSalesSummary>();
  const productMap = new Map<string, ProductSalesSummary>();

  let totalRevenue = 0;
  let totalQuantity = 0;

  for (const order of filteredOrders) {
    for (const item of order.items) {
      const q = item.quantity;
      const amount = item.lineTotal;

      totalRevenue += amount;
      totalQuantity += q;

      const productId = item.productId ?? "unknown-product";
      const variantId = item.variantId ?? `custom-${item.productName}-${item.variantName}`;
      const productName = item.productName;
      const variantName = item.variantName;
      const unitPrice = item.unitPrice ?? 0;
      const priceUnit = item.priceUnit;

      // Aggregate Variant
      const existingVar = variantMap.get(variantId);
      if (existingVar) {
        existingVar.totalQuantity += q;
        existingVar.totalRevenue += amount;
      } else {
        variantMap.set(variantId, {
          variantId,
          productId,
          productName,
          variantName,
          priceUnit,
          unitPrice,
          totalQuantity: q,
          totalRevenue: amount,
          revenueSharePercent: 0,
        });
      }

      // Aggregate Product
      const existingProd = productMap.get(productId);
      if (existingProd) {
        existingProd.totalQuantity += q;
        existingProd.totalRevenue += amount;
      } else {
        productMap.set(productId, {
          productId,
          productName,
          totalQuantity: q,
          totalRevenue: amount,
          revenueSharePercent: 0,
          variants: [],
        });
      }
    }
  }

  // Calculate percentages and attach variants to products
  const variants = [...variantMap.values()];
  for (const v of variants) {
    v.revenueSharePercent = totalRevenue > 0 ? (v.totalRevenue / totalRevenue) * 100 : 0;
  }

  const products = [...productMap.values()];
  for (const p of products) {
    p.revenueSharePercent = totalRevenue > 0 ? (p.totalRevenue / totalRevenue) * 100 : 0;
    p.variants = variants
      .filter((v) => v.productId === p.productId)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  // Sort products by total revenue descending
  products.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Search filter if provided
  let finalProducts = products;
  if (filter.search) {
    const s = filter.search.toLowerCase();
    finalProducts = products.filter(
      (p) =>
        p.productName.toLowerCase().includes(s) ||
        p.variants.some((v) => v.variantName.toLowerCase().includes(s)),
    );
  }

  return {
    products: finalProducts,
    totalRevenue,
    totalQuantity,
    completedOrdersCount: filteredOrders.length,
  };
}
