import "server-only";

import { getPrisma } from "./prisma";
import { jakartaDateKey, type OrderStatus } from "./order-types";
import {
  productionGroupKey,
  stageIndex,
  todayKey,
  type ProductionDay,
  type ProductionDaySummary,
  type ProductionGroup,
  type ProductionMonth,
} from "./production-types";

/** Hanya pesanan aktif yang masuk kalender produksi. */
const ACTIVE_STATUSES: OrderStatus[] = ["BARU", "DIPROSES"];

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
      orderItem: {
        select: { productName: true, variantName: true, quantity: true },
      },
    },
  });

  const buckets = new Map<
    string,
    {
      orders: Set<string>;
      itemCount: number;
      products: Map<string, { name: string; quantity: number }>;
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
        products: new Map<string, { name: string; quantity: number }>(),
        allReady: true,
      };

    bucket.orders.add(task.orderId);
    bucket.itemCount += 1;

    // Highlight sel kalender memakai produk + varian agar sama dengan grup
    // di panel hari.
    const productKey = productionGroupKey(
      task.orderItem.productName,
      task.orderItem.variantName,
    );
    const product = bucket.products.get(productKey) ?? {
      name: task.orderItem.variantName
        ? `${task.orderItem.productName} — ${task.orderItem.variantName}`
        : task.orderItem.productName,
      quantity: 0,
    };

    product.quantity += task.orderItem.quantity;
    bucket.products.set(productKey, product);

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
      highlights: Array.from(bucket.products.values())
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
    select: {
      id: true,
      stage: true,
      orderId: true,
      orderItem: {
        select: {
          productName: true,
          variantName: true,
          quantity: true,
        },
      },
    },
    orderBy: [{ orderItem: { sortOrder: "asc" } }, { createdAt: "asc" }],
  });

  const groups = new Map<
    string,
    { group: ProductionGroup; orderIds: Set<string> }
  >();
  const orderIds = new Set<string>();

  for (const task of tasks) {
    const { productName, variantName, quantity } = task.orderItem;
    const key = productionGroupKey(productName, variantName);
    const existing = groups.get(key);

    orderIds.add(task.orderId);

    if (existing) {
      existing.group.quantity += quantity;
      existing.group.taskIds.push(task.id);
      existing.orderIds.add(task.orderId);

      // Tahap grup mengikuti item yang paling awal supaya grup tidak
      // terlihat selesai padahal masih ada yang tertinggal.
      if (stageIndex(task.stage) < stageIndex(existing.group.stage)) {
        existing.group.stage = task.stage;
      }

      continue;
    }

    groups.set(key, {
      group: {
        key,
        productName,
        variantName,
        quantity,
        orderCount: 1,
        taskIds: [task.id],
        stage: task.stage,
      },
      orderIds: new Set([task.orderId]),
    });
  }

  const list = Array.from(groups.values(), ({ group, orderIds: ids }) => ({
    ...group,
    orderCount: ids.size,
  })).sort(
    (a, b) =>
      a.productName.localeCompare(b.productName) ||
      (a.variantName ?? "").localeCompare(b.variantName ?? ""),
  );

  return {
    dateKey,
    groups: list,
    orderCount: orderIds.size,
    itemCount: tasks.length,
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
