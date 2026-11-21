import type { AdminOrder } from "./order-types";

export type CustomerSummary = {
  key: string;
  name: string;
  phone: string;
  address: string;
  orderCount: number;
  completedOrderCount: number;
  totalSpent: number;
  firstOrderAt: Date;
  latestOrderAt: Date;
  orders: AdminOrder[];
};

export const CUSTOMER_SORT_KEYS = [
  "spent_desc",
  "orders_desc",
  "latest_desc",
  "name_asc",
] as const;

export type CustomerSortKey = (typeof CUSTOMER_SORT_KEYS)[number];

export type CustomerFilterOptions = {
  q?: string;
  sort?: CustomerSortKey;
};
