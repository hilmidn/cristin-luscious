import "server-only";

import { getPrisma } from "./prisma";
import type {
  AdminOrder,
  AdminOrderListItem,
  OrderSourceOption,
  OrderStatus,
  OrderableProduct,
  ServiceType,
} from "./order-types";

type OrderFilters = {
  status?: OrderStatus;
  source?: string;
  q?: string;
};

const orderItemsInclude = {
  orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
};

export async function getAdminOrders(
  filters: OrderFilters = {},
): Promise<AdminOrderListItem[]> {
  const search = filters.q?.trim();

  const orders = await getPrisma().order.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.source ? { source: filters.source } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" as const } },
              {
                customerName: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { quantity: true } },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    code: order.code,
    customerName: order.customerName,
    phone: order.phone,
    serviceType: order.serviceType as ServiceType,
    source: order.source,
    status: order.status as OrderStatus,
    total: order.total,
    itemCount: order.items.length,
    unitCount: order.items.reduce((total, item) => total + item.quantity, 0),
    createdAt: order.createdAt,
  }));
}

export async function getAdminOrderById(id: string): Promise<AdminOrder | null> {
  const order = await getPrisma().order.findUnique({
    where: { id },
    include: { items: orderItemsInclude },
  });

  if (!order) {
    return null;
  }

  return {
    id: order.id,
    code: order.code,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    serviceType: order.serviceType as ServiceType,
    deliveryPoint: order.deliveryPoint,
    deliveryMapUrl: order.deliveryMapUrl,
    source: order.source,
    note: order.note,
    shippingCost: order.shippingCost,
    subtotal: order.subtotal,
    total: order.total,
    status: order.status as OrderStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      productId: item.productId,
      productName: item.productName,
      variantName: item.variantName,
      unitPrice: item.unitPrice,
      priceUnit: item.priceUnit,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  };
}

/**
 * Daftar sumber pesanan tanpa tabel master: diambil dari nilai `source` yang
 * sudah pernah dipakai, diurutkan dari yang paling sering.
 */
export async function getOrderSources(): Promise<OrderSourceOption[]> {
  const rows = await getPrisma().order.groupBy({
    by: ["source"],
    where: { source: { not: null } },
    _count: { _all: true },
  });

  return rows
    .map((row) => ({
      source: (row.source ?? "").trim(),
      count: row._count._all,
    }))
    .filter((row) => row.source.length > 0)
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
}

export async function getOrderStats() {
  const prisma = getPrisma();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, baru, diproses, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "BARU" } }),
    prisma.order.count({ where: { status: "DIPROSES" } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: { not: "DIBATALKAN" },
        createdAt: { gte: startOfMonth },
      },
    }),
  ]);

  return {
    total,
    baru,
    diproses,
    monthRevenue: revenue._sum.total ?? 0,
  };
}

/**
 * Katalog yang bisa dipilih di form pesanan: produk terbit beserta varian
 * terbit. Produk tanpa varian muncul sebagai satu entri harga manual.
 */
export async function getOrderableProducts(): Promise<OrderableProduct[]> {
  const products = await getPrisma().product.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      variants: {
        where: { published: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, price: true, priceUnit: true },
      },
    },
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      priceUnit: variant.priceUnit,
    })),
  }));
}
