import "server-only";

import { getPrisma } from "./prisma";
import { jakartaMonthRange } from "./order-types";
import type {
  AdminOrder,
  OrderSourceOption,
  OrderStatus,
  OrderableProduct,
  ServiceType,
} from "./order-types";

type OrderFilters = {
  statuses?: OrderStatus[];
  source?: string;
  q?: string;
};

const orderItemSelect = {
  id: true,
  variantId: true,
  productId: true,
  productName: true,
  variantName: true,
  unitPrice: true,
  priceUnit: true,
  quantity: true,
  lineTotal: true,
} as const;

const orderItemsInclude = {
  select: orderItemSelect,
  orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
};

type OrderRow = {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  address: string;
  scheduledAt: Date | null;
  serviceType: string;
  deliveryPoint: string | null;
  deliveryMapUrl: string | null;
  source: string | null;
  note: string | null;
  shippingCost: number;
  subtotal: number;
  total: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    variantId: string | null;
    productId: string | null;
    productName: string;
    variantName: string;
    unitPrice: number | null;
    priceUnit: string | null;
    quantity: number;
    lineTotal: number;
  }[];
};

function toAdminOrder(order: OrderRow): AdminOrder {
  return {
    id: order.id,
    code: order.code,
    customerName: order.customerName,
    phone: order.phone,
    address: order.address,
    scheduledAt: order.scheduledAt,
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
 * Daftar pesanan sudah membawa detail lengkap (item, alamat, ongkir) supaya
 * popup detail di tabel bisa terbuka tanpa request tambahan.
 */
export async function getAdminOrders(
  filters: OrderFilters = {},
): Promise<AdminOrder[]> {
  const search = filters.q?.trim();

  const orders = await getPrisma().order.findMany({
    where: {
      ...(filters.statuses?.length ? { status: { in: filters.statuses } } : {}),
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
    include: { items: orderItemsInclude },
  });

  return orders.map(toAdminOrder);
}

export async function getAdminOrderById(id: string): Promise<AdminOrder | null> {
  const order = await getPrisma().order.findUnique({
    where: { id },
    include: { items: orderItemsInclude },
  });

  return order ? toAdminOrder(order) : null;
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
  const { start: startOfMonth, end: startOfNextMonth } = jakartaMonthRange(now);

  /**
   * Bulan statistik memakai tanggal ambil/kirim (`scheduledAt`) karena pesanan
   * ini pre-order: pendapatan diakui saat barang diserahkan, bukan saat
   * dicatat. Data lama tanpa jadwal jatuh ke `createdAt`.
   */
  const thisMonth = {
    OR: [
      { scheduledAt: { gte: startOfMonth, lt: startOfNextMonth } },
      { scheduledAt: null, createdAt: { gte: startOfMonth, lt: startOfNextMonth } },
    ],
  };

  const [total, baru, diproses, selesai, dibatalkan, revenue, cancelled] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "BARU" } }),
      prisma.order.count({ where: { status: "DIPROSES" } }),
      prisma.order.count({ where: { status: "SELESAI" } }),
      prisma.order.count({ where: { status: "DIBATALKAN" } }),
      // Pendapatan hanya dari pesanan yang benar-benar selesai.
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "SELESAI", ...thisMonth },
      }),
      // Nilai pesanan batal dipisah supaya tidak tercampur ke pendapatan.
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "DIBATALKAN", ...thisMonth },
      }),
    ]);

  return {
    total,
    baru,
    diproses,
    selesai,
    dibatalkan,
    monthRevenue: revenue._sum.total ?? 0,
    monthCancelled: cancelled._sum.total ?? 0,
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
