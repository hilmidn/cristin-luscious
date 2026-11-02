import "server-only";

import { getAdminOrders } from "./orders";
import { normalizePhone } from "./order-types";
import type { CustomerSummary, CustomerFilterOptions } from "./customer-types";

export async function getCustomers(
  filters: CustomerFilterOptions = {},
): Promise<CustomerSummary[]> {
  const orders = await getAdminOrders();
  const map = new Map<string, CustomerSummary>();

  for (const order of orders) {
    const name = order.customerName.trim();
    if (!name) continue;

    const key = normalizePhone(order.phone) || name.toLowerCase();
    const existing = map.get(key);

    const isCompleted = order.status === "SELESAI";
    const orderTotal = isCompleted ? order.total : 0;

    if (existing) {
      existing.orderCount += 1;
      if (isCompleted) {
        existing.completedOrderCount += 1;
        existing.totalSpent += orderTotal;
      }
      if (order.createdAt < existing.firstOrderAt) {
        existing.firstOrderAt = order.createdAt;
      }
      if (order.createdAt > existing.latestOrderAt) {
        existing.latestOrderAt = order.createdAt;
        // Update to latest contact info used
        existing.name = name;
        existing.phone = order.phone.trim();
        existing.address = order.address.trim();
      }
      existing.orders.push(order);
    } else {
      map.set(key, {
        key,
        name,
        phone: order.phone.trim(),
        address: order.address.trim(),
        orderCount: 1,
        completedOrderCount: isCompleted ? 1 : 0,
        totalSpent: orderTotal,
        firstOrderAt: order.createdAt,
        latestOrderAt: order.createdAt,
        orders: [order],
      });
    }
  }

  let results = [...map.values()];

  const search = filters.q?.trim().toLowerCase();
  if (search) {
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.phone.includes(search) ||
        c.address.toLowerCase().includes(search),
    );
  }

  const sort = filters.sort ?? "spent_desc";
  results.sort((a, b) => {
    if (sort === "spent_desc") {
      return b.totalSpent - a.totalSpent || b.orderCount - a.orderCount;
    }
    if (sort === "orders_desc") {
      return b.orderCount - a.orderCount || b.totalSpent - a.totalSpent;
    }
    if (sort === "latest_desc") {
      return b.latestOrderAt.getTime() - a.latestOrderAt.getTime();
    }
    return a.name.localeCompare(b.name);
  });

  // Sort orders within each customer descending by date
  for (const c of results) {
    c.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  return results;
}
