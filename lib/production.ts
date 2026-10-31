import "server-only";

import { getPrisma } from "./prisma";
import { jakartaDateKey, type OrderStatus, type ServiceType } from "./order-types";
import {
  todayKey,
  type ProductionDay,
  type ProductionDayOrder,
  type ProductionDaySummary,
  type ProductionItem,
  type ProductionMonth,
  type ProductionStage,
} from "./production-types";

/** Hanya pesanan aktif yang masuk kalender produksi. */
const ACTIVE_STATUSES: OrderStatus[] = ["BARU", "DIPROSES"];

const productionTaskInclude = {
  order: {
    select: {
      id: true,
      code: true,
      customerName: true,
      phone: true,
      serviceType: true,
    },
  },
  orderItem: {
    select: {
      id: true,
      productName: true,
      variantName: true,
      quantity: true,
    },
  },
} as const;

type TaskRow = {
  id: string;
  stage: ProductionStage;
  note: string | null;
  order: {
    id: string;
    code: string;
    customerName: string;
    phone: string;
    serviceType: string;
  };
  orderItem: {
    id: string;
    productName: string;
    variantName: string;
    quantity: number;
  };
};

function toProductionItem(task: TaskRow): ProductionItem {
  return {
    taskId: task.id,
    orderItemId: task.orderItem.id,
    orderId: task.order.id,
    orderCode: task.order.code,
    customerName: task.order.customerName,
    phone: task.order.phone,
    serviceType: task.order.serviceType as ServiceType,
    productName: task.orderItem.productName,
    variantName: task.orderItem.variantName,
    quantity: task.orderItem.quantity,
    stage: task.stage,
    note: task.note,
  };
}

/** Batas tanggal DATE (UTC midnight) untuk satu hari. */
function dayRange(dateKey: string) {
  const start = new Date(`${dateKey}T00:00:00.000Z`);

  return {
    start,
    end: new Date(start.getTime() + 24 * 60 * 60 * 1000),
  };
}

/** Batas tanggal DATE untuk satu bulan. */
function monthRange(monthKey: string) {
  const start = new Date(`${monthKey}-01T00:00:00.000Z`);
  const [year, month] = monthKey.split("-").map(Number);

  return {
    start,
    end: new Date(Date.UTC(year, month, 1)),
  };
}

export async function getProductionMonth(
  monthKey: string,
): Promise<ProductionMonth> {
  const { start, end } = monthRange(monthKey);

  const tasks = await getPrisma().productionTask.findMany({
    where: {
      scheduledAt: { gte: start, lt: end },
      order: { status: { in: ACTIVE_STATUSES } },
    },
    select: {
      scheduledAt: true,
      stage: true,
      orderId: true,
      orderItem: { select: { productName: true, quantity: true } },
    },
  });

  const buckets = new Map<
    string,
    {
      orders: Set<string>;
      itemCount: number;
      products: Map<string, number>;
      allReady: boolean;
    }
  >();

  for (const task of tasks) {
    const dateKey = jakartaDateKey(task.scheduledAt);
    const bucket =
      buckets.get(dateKey) ??
      {
        orders: new Set<string>(),
        itemCount: 0,
        products: new Map<string, number>(),
        allReady: true,
      };

    bucket.orders.add(task.orderId);
    bucket.itemCount += 1;
    bucket.products.set(
      task.orderItem.productName,
      (bucket.products.get(task.orderItem.productName) ?? 0) +
        task.orderItem.quantity,
    );

    if (task.stage !== "SIAP") {
      bucket.allReady = false;
    }

    buckets.set(dateKey, bucket);
  }

  const days: Record<string, ProductionDaySummary> = {};

  for (const [dateKey, bucket] of buckets) {
    days[dateKey] = {
      orderCount: bucket.orders.size,
      itemCount: bucket.itemCount,
      highlights: Array.from(bucket.products, ([name, quantity]) => ({
        name,
        quantity,
      }))
        .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
        .slice(0, 2),
      allReady: bucket.allReady,
    };
  }

  return { monthKey, days };
}

export async function getProductionDay(dateKey: string): Promise<ProductionDay> {
  const { start, end } = dayRange(dateKey);

  const tasks = await getPrisma().productionTask.findMany({
    where: {
      scheduledAt: { gte: start, lt: end },
      order: { status: { in: ACTIVE_STATUSES } },
    },
    include: productionTaskInclude,
    orderBy: [
      { order: { code: "asc" } },
      { orderItem: { sortOrder: "asc" } },
      { createdAt: "asc" },
    ],
  });

  const groups = new Map<string, ProductionDayOrder>();

  for (const task of tasks) {
    const item = toProductionItem(task);
    const group =
      groups.get(item.orderId) ??
      ({
        orderId: item.orderId,
        code: item.orderCode,
        customerName: item.customerName,
        phone: item.phone,
        serviceType: item.serviceType,
        items: [],
      } satisfies ProductionDayOrder);

    group.items.push(item);
    groups.set(item.orderId, group);
  }

  const orders = Array.from(groups.values());

  return {
    dateKey,
    orders,
    orderCount: orders.length,
    itemCount: orders.reduce((sum, order) => sum + order.items.length, 0),
  };
}

/** Ringkasan cepat untuk header halaman: hari ini + yang terlewat. */
export async function getProductionOverview(now: Date = new Date()) {
  const today = todayKey(now);
  const { start } = dayRange(today);

  const prisma = getPrisma();
  const activeWhere = { order: { status: { in: ACTIVE_STATUSES } } };

  const [todayItems, todayReady, overdue, active] = await Promise.all([
    prisma.productionTask.count({
      where: { ...activeWhere, scheduledAt: { gte: start, lt: dayRange(today).end } },
    }),
    prisma.productionTask.count({
      where: {
        ...activeWhere,
        stage: "SIAP",
        scheduledAt: { gte: start, lt: dayRange(today).end },
      },
    }),
    prisma.productionTask.count({
      where: {
        ...activeWhere,
        stage: { not: "SIAP" },
        scheduledAt: { lt: start },
      },
    }),
    prisma.productionTask.count({ where: activeWhere }),
  ]);

  return { today, todayItems, todayReady, overdue, active };
}
