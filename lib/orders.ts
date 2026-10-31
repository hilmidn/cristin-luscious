import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "./prisma";
import {
  jakartaMonthKey,
  monthKeyLabel,
  monthRangeFromKey,
  shiftMonthKeyValue,
} from "./order-types";
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
  /** Bulan WIB `YYYY-MM`, berbasis tanggal ambil/kirim (fallback `createdAt`). */
  month?: string;
  limit?: number;
};

/**
 * Filter bulan untuk order: tanggal ambil/kirim (`scheduledAt`) karena pesanan
 * ini pre-order. Data lama tanpa jadwal jatuh ke `createdAt`.
 */
function monthFilter(monthKey: string): Prisma.OrderWhereInput {
  const { start, end } = monthRangeFromKey(monthKey);

  return {
    OR: [
      { scheduledAt: { gte: start, lt: end } },
      { scheduledAt: null, createdAt: { gte: start, lt: end } },
    ],
  };
}

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
  const conditions: Prisma.OrderWhereInput[] = [];

  if (search) {
    conditions.push({
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
    });
  }

  if (filters.month) {
    conditions.push(monthFilter(filters.month));
  }

  const orders = await getPrisma().order.findMany({
    where: {
      ...(filters.statuses?.length ? { status: { in: filters.statuses } } : {}),
      ...(filters.source ? { source: filters.source } : {}),
      ...(conditions.length ? { AND: conditions } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit,
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
  const thisMonth = monthFilter(jakartaMonthKey(new Date()));

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

export type RecapStats = {
  monthKey: string | null;
  selesai: number;
  dibatalkan: number;
  revenue: number;
  cancelled: number;
};

/**
 * Statistik pesanan tertutup untuk satu bulan (`monthKey` null = semua bulan).
 * Dipakai halaman Rekap Pesanan agar kartu angka ikut filter bulan.
 */
export async function getRecapStats(
  monthKey: string | null,
): Promise<RecapStats> {
  const prisma = getPrisma();
  const month = monthKey ? monthFilter(monthKey) : {};

  const [selesai, dibatalkan, revenue, cancelled] = await Promise.all([
    prisma.order.count({ where: { status: "SELESAI", ...month } }),
    prisma.order.count({ where: { status: "DIBATALKAN", ...month } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: "SELESAI", ...month },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: "DIBATALKAN", ...month },
    }),
  ]);

  return {
    monthKey,
    selesai,
    dibatalkan,
    revenue: revenue._sum.total ?? 0,
    cancelled: cancelled._sum.total ?? 0,
  };
}

/** Bulan yang sudah punya pesanan selesai / batal, terbaru dulu. */
export async function getClosedOrderMonths(): Promise<string[]> {
  const rows = await getPrisma().order.findMany({
    where: { status: { in: ["SELESAI", "DIBATALKAN"] } },
    select: { scheduledAt: true, createdAt: true },
  });

  const keys = new Set(
    rows.map((row) => jakartaMonthKey(row.scheduledAt ?? row.createdAt)),
  );

  return [...keys].sort((a, b) => b.localeCompare(a));
}

export type OrderTrendPoint = {
  monthKey: string;
  label: string;
  shortLabel: string;
  revenue: number;
  cancelled: number;
  selesai: number;
  dibatalkan: number;
};

/**
 * Pendapatan & nilai batal per bulan untuk `monthCount` bulan terakhir
 * (termasuk bulan berjalan), dihitung sekali query lalu dikelompokkan di
 * memori.
 */
export async function getOrderTrend(
  monthCount = 6,
): Promise<OrderTrendPoint[]> {
  const now = new Date();
  const current = jakartaMonthKey(now);
  const monthKeys = Array.from({ length: monthCount }, (_, index) =>
    shiftMonthKeyValue(current, index - (monthCount - 1)),
  );
  const earliest = monthRangeFromKey(monthKeys[0]);

  const rows = await getPrisma().order.findMany({
    where: {
      status: { in: ["SELESAI", "DIBATALKAN"] },
      OR: [
        { scheduledAt: { gte: earliest.start } },
        { scheduledAt: null, createdAt: { gte: earliest.start } },
      ],
    },
    select: { status: true, total: true, scheduledAt: true, createdAt: true },
  });

  const buckets = new Map(
    monthKeys.map((monthKey) => [
      monthKey,
      { revenue: 0, cancelled: 0, selesai: 0, dibatalkan: 0 },
    ]),
  );

  for (const row of rows) {
    const bucket = buckets.get(jakartaMonthKey(row.scheduledAt ?? row.createdAt));

    if (!bucket) {
      continue;
    }

    if (row.status === "SELESAI") {
      bucket.revenue += row.total;
      bucket.selesai += 1;
    } else {
      bucket.cancelled += row.total;
      bucket.dibatalkan += 1;
    }
  }

  return monthKeys.map((monthKey) => ({
    monthKey,
    label: monthKeyLabel(monthKey),
    shortLabel: monthKeyLabel(monthKey, "short").split(" ")[0],
    ...(buckets.get(monthKey) ?? {
      revenue: 0,
      cancelled: 0,
      selesai: 0,
      dibatalkan: 0,
    }),
  }));
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
