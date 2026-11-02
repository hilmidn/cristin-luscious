export type VariantSalesSummary = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  priceUnit: string | null;
  unitPrice: number;
  totalQuantity: number;
  totalRevenue: number;
  revenueSharePercent: number;
};

export type ProductSalesSummary = {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  revenueSharePercent: number;
  variants: VariantSalesSummary[];
};

export type SalesReportFilter = {
  month?: string; // YYYY-MM
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  search?: string;
};
