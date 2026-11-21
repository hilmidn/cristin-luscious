import "server-only";

import {
  calculateOrderTotals,
  canFulfillFromStock,
  isAllowedWebOrderDate,
  isMapUrl,
  isValidPhone,
  jakartaDateKey,
  jakartaStartOfDay,
  minimumPreOrderDate,
  normalizePhone,
  ORDER_STATUSES,
  SERVICE_TYPES,
  type FulfillmentType,
  type OrderInput,
  type OrderStatus,
  type ServiceType,
} from "@/lib/order-types";
import { getPrisma, TX_OPTIONS } from "@/lib/prisma";
import { deductIngredientsForOrder } from "@/lib/inventory";
import { recordStockMovement } from "@/lib/stock";

/**
 * Inti logika simpan pesanan — dipakai server action admin (saveOrder) DAN
 * endpoint API mobile POST /api/v1/orders. Auth & revalidatePath ditangani
 * pemanggil, bukan di sini.
 */

export type SaveOrderResult =
  | { ok: true; id: string; code: string }
  | { ok: false; error: string };

const MAX_NAME = 120;
const MAX_ADDRESS = 500;
const MAX_SOURCE = 60;
const MAX_NOTE = 500;
const MAX_QUANTITY = 999;
const MAX_CODE_ATTEMPTS = 5;

function parseQuantity(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > MAX_QUANTITY) {
    throw new Error(`Jumlah item harus bilangan bulat 1 sampai ${MAX_QUANTITY}.`);
  }

  return value;
}

function parseMoney(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Nominal tidak boleh negatif.");
  }

  return Math.round(value);
}

function parseStatus(value: OrderStatus): OrderStatus {
  return ORDER_STATUSES.includes(value) ? value : "BARU";
}

function parseServiceType(value: ServiceType): ServiceType {
  if (!SERVICE_TYPES.includes(value)) {
    throw new Error("Jenis layanan tidak valid.");
  }

  return value;
}

/** Tanggal jadwal disimpan sebagai kolom DATE (tengah malam UTC). */
function parseScheduledAt(value: string | null | undefined): Date | null {
  const raw = value?.trim() ?? "";

  if (!raw) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error("Tanggal ambil / kirim tidak valid.");
  }

  const date = new Date(`${raw}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== raw
  ) {
    throw new Error("Tanggal ambil / kirim tidak valid.");
  }

  return date;
}

type ResolvedItem = {
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string;
  unitPrice: number | null;
  priceUnit: string | null;
  quantity: number;
  sortOrder: number;
  lineTotal: number;
};

function isCodeConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * P2028 = transaksi dibatalkan Prisma karena melewati batas waktu (atau
 * koneksinya putus). Perubahan sudah di-rollback, jadi aman untuk dicoba lagi.
 */
function isTransactionExpired(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const { code, message } = error as { code?: string; message?: string };

  return code === "P2028" || /transaction.*expired/i.test(message ?? "");
}

class StockAvailabilityChangedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StockAvailabilityChangedError";
  }
}

/** True bila tanggal ambil/kirim = hari ini menurut WIB. */
function isTodayWib(date: Date): boolean {
  return jakartaDateKey(date) === jakartaDateKey(new Date());
}

/** Baris item yang akan dibuat sekaligus lewat `createMany`. */
type OrderItemCreateData = {
  orderId: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string;
  unitPrice: number | null;
  priceUnit: string | null;
  quantity: number;
  sortOrder: number;
  lineTotal: number;
  fulfillmentType: FulfillmentType;
};

type ExistingOrderItem = Omit<OrderItemCreateData, "orderId" | "fulfillmentType"> & {
  id: string;
  fulfillmentType: FulfillmentType | null;
  productionTask: { stage: string } | null;
};

/**
 * Kunci pencocokan item lama vs item form. Varian/produk yang sudah dihapus
 * dari katalog fallback ke snapshot nama.
 */
function itemKey(item: {
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string;
}): string {
  return (
    item.variantId ??
    item.productId ??
    `${item.productName}::${item.variantName}`
  );
}

/** True bila item di DB sudah identik dengan isian form (tidak perlu update). */
function isSameOrderItem(
  current: ExistingOrderItem,
  next: ResolvedItem,
  fulfillmentType: FulfillmentType,
) {
  return (
    current.productId === next.productId &&
    current.variantId === next.variantId &&
    current.productName === next.productName &&
    current.variantName === next.variantName &&
    current.unitPrice === next.unitPrice &&
    current.priceUnit === next.priceUnit &&
    current.quantity === next.quantity &&
    current.sortOrder === next.sortOrder &&
    current.lineTotal === next.lineTotal &&
    current.fulfillmentType === fulfillmentType
  );
}

function hasCompletedFulfillmentChanges(
  currentItems: ExistingOrderItem[],
  nextItems: ResolvedItem[],
  currentScheduledAt: Date | null,
  nextScheduledAt: Date,
): boolean {
  if (
    !currentScheduledAt ||
    jakartaDateKey(currentScheduledAt) !== jakartaDateKey(nextScheduledAt)
  ) {
    return true;
  }

  const queues = new Map<string, ExistingOrderItem[]>();

  for (const item of currentItems) {
    const key = itemKey(item);
    const queue = queues.get(key) ?? [];
    queue.push(item);
    queues.set(key, queue);
  }

  for (const item of nextItems) {
    const current = queues.get(itemKey(item))?.shift();

    if (
      !current ||
      current.productId !== item.productId ||
      current.variantId !== item.variantId ||
      current.quantity !== item.quantity
    ) {
      return true;
    }
  }

  return Array.from(queues.values()).some((queue) => queue.length > 0);
}

function codePrefix(date: Date) {
  // Tanggal WIB, bukan zona waktu server.
  const [year, month, day] = jakartaDateKey(date).split("-");

  return `CL-${year.slice(2)}${month}${day}`;
}

export async function saveOrderCore(
  input: OrderInput,
  origin: "ADMIN" | "WEB" = "ADMIN",
): Promise<SaveOrderResult> {
  try {
    const customerName = input.customerName?.trim() ?? "";
    if (!customerName) throw new Error("Nama pemesan wajib diisi.");
    if (customerName.length > MAX_NAME) {
      throw new Error(`Nama pemesan maksimal ${MAX_NAME} karakter.`);
    }

    const phone = normalizePhone(input.phone ?? "");
    if (!isValidPhone(phone)) {
      throw new Error("Nomor HP tidak valid. Contoh: 08123456789.");
    }

    const address = input.address?.trim() ?? "";

    // Alamat wajib hanya untuk ANTAR — order web pickup-only tanpa alamat.
    if (address.length > MAX_ADDRESS) {
      throw new Error(`Alamat maksimal ${MAX_ADDRESS} karakter.`);
    }

    const serviceType = parseServiceType(input.serviceType);

    if (serviceType === "ANTAR" && !address) {
      throw new Error("Alamat wajib diisi untuk layanan antar.");
    }

    const scheduledAt = parseScheduledAt(input.scheduledAt);
    if (!scheduledAt) {
      throw new Error("Tanggal ambil / kirim wajib diisi.");
    }

    const deliveryPoint = input.deliveryPoint?.trim() ?? "";

    if (serviceType === "ANTAR" && deliveryPoint.length < 5) {
      throw new Error(
        "Layanan antar wajib menyertakan titik lokasi pengantaran.",
      );
    }

    const rawMapUrl = input.deliveryMapUrl?.trim() ?? "";
    if (rawMapUrl && !isMapUrl(rawMapUrl)) {
      throw new Error("Link lokasi harus berupa URL http(s) yang valid.");
    }

    const source = input.source?.trim() ?? "";
    if (source.length > MAX_SOURCE) {
      throw new Error(`Sumber pesanan maksimal ${MAX_SOURCE} karakter.`);
    }

    const note = input.note?.trim() ?? "";
    if (note.length > MAX_NOTE) {
      throw new Error(`Catatan maksimal ${MAX_NOTE} karakter.`);
    }

    const shippingCost =
      serviceType === "ANTAR" ? (parseMoney(input.shippingCost) ?? 0) : 0;

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new Error("Pesanan minimal berisi satu item.");
    }

    const prisma = getPrisma();

    const variantIds = Array.from(
      new Set(
        input.items
          .map((item) => item.variantId)
          .filter((value): value is string => Boolean(value)),
      ),
    );
    const productIds = Array.from(
      new Set(
        input.items
          .filter((item) => !item.variantId && item.productId)
          .map((item) => item.productId as string),
      ),
    );

    const [variants, products] = await Promise.all([
      variantIds.length
        ? prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: {
              id: true,
              name: true,
              price: true,
              priceUnit: true,
              product: { select: { id: true, name: true } },
            },
          })
        : Promise.resolve([]),
      productIds.length
        ? prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
    const productMap = new Map(products.map((product) => [product.id, product]));

    let resolvedItems: ResolvedItem[] = input.items.map((item, index) => {
      const quantity = parseQuantity(item.quantity);

      // Varian: nama & harga selalu diambil dari database, bukan dari client.
      if (item.variantId) {
        const variant = variantMap.get(item.variantId);

        if (!variant) {
          throw new Error(
            "Varian sudah tidak tersedia. Tarik ulang katalog lalu coba lagi.",
          );
        }

        return {
          productId: variant.product.id,
          variantId: variant.id,
          productName: variant.product.name,
          variantName: variant.name,
          unitPrice: variant.price,
          priceUnit: variant.priceUnit,
          quantity,
          sortOrder: index,
          lineTotal: (variant.price ?? 0) * quantity,
        };
      }

      // Produk tanpa varian (custom order): harga diisi manual oleh admin.
      if (item.productId) {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new Error(
            "Produk sudah tidak tersedia. Tarik ulang katalog lalu coba lagi.",
          );
        }

        const unitPrice = parseMoney(item.unitPrice);

        return {
          productId: product.id,
          variantId: null,
          productName: product.name,
          variantName: item.variantName?.trim() || "Custom",
          unitPrice,
          priceUnit: item.priceUnit?.trim() || null,
          quantity,
          sortOrder: index,
          lineTotal: (unitPrice ?? 0) * quantity,
        };
      }

      // Snapshot lama: varian/produk sudah dihapus dari katalog.
      const productName = item.productName?.trim() ?? "";
      const variantName = item.variantName?.trim() ?? "";

      if (!productName || !variantName) {
        throw new Error("Ada item yang belum memilih produk atau varian.");
      }

      const unitPrice = parseMoney(item.unitPrice);

      return {
        productId: null,
        variantId: null,
        productName,
        variantName,
        unitPrice,
        priceUnit: item.priceUnit?.trim() || null,
        quantity,
        sortOrder: index,
        lineTotal: (unitPrice ?? 0) * quantity,
      };
    });

    if (
      origin === "WEB" &&
      !isAllowedWebOrderDate(jakartaDateKey(scheduledAt), new Date())
    ) {
      throw new Error(
        `Tanggal pre-order paling cepat ${minimumPreOrderDate(new Date())}. Ambil hari ini hanya tersedia jika semua stok cukup.`,
      );
    }

    const existing = input.id
      ? await prisma.order.findUnique({
          where: { id: input.id },
          include: {
            // Data item diambil di luar transaksi: mengurangi round-trip dan
            // dipakai untuk melewati update yang tidak mengubah apa pun.
            items: {
              select: {
                id: true,
                productId: true,
                variantId: true,
                productName: true,
                variantName: true,
                unitPrice: true,
                priceUnit: true,
                quantity: true,
                sortOrder: true,
                lineTotal: true,
                fulfillmentType: true,
                productionTask: { select: { stage: true } },
              },
            },
          },
        })
      : null;

    if (input.id && !existing) {
      return { ok: false, error: "Pesanan tidak ditemukan." };
    }

    // Nota batal = final: stok jadinya sudah dikembalikan saat pembatalan,
    // sedangkan delta edit dihitung dari item lama — mengedit di sini akan
    // membuat stok meleset. Hapus saja pesanannya bila salah buat.
    if (existing?.status === "DIBATALKAN") {
      return {
        ok: false,
        error:
          "Pesanan yang sudah dibatalkan tidak bisa diedit. Hapus pesanannya bila salah buat.",
      };
    }

    if (
      existing?.status === "SELESAI" &&
      hasCompletedFulfillmentChanges(
        existing.items,
        resolvedItems,
        existing.scheduledAt,
        scheduledAt,
      )
    ) {
      throw new Error(
        "Pesanan selesai tidak dapat mengubah item, jumlah, atau tanggal. Koreksi stok fisik dilakukan lewat halaman stok.",
      );
    }

    if (existing?.status === "SELESAI") {
      const snapshotQueues = new Map<string, ExistingOrderItem[]>();

      for (const item of existing.items) {
        const key = itemKey(item);
        const queue = snapshotQueues.get(key) ?? [];
        queue.push(item);
        snapshotQueues.set(key, queue);
      }

      resolvedItems = resolvedItems.map((item) => {
        const snapshot = snapshotQueues.get(itemKey(item))?.shift();

        if (!snapshot) {
          throw new Error(
            "Snapshot item pesanan selesai tidak lengkap dan perlu ditinjau admin.",
          );
        }

        return {
          ...item,
          productName: snapshot.productName,
          variantName: snapshot.variantName,
          unitPrice: snapshot.unitPrice,
          priceUnit: snapshot.priceUnit,
          sortOrder: snapshot.sortOrder,
          lineTotal: (snapshot.unitPrice ?? 0) * item.quantity,
        };
      });
    }

    const totals = calculateOrderTotals(resolvedItems, shippingCost);

    const orderData = {
      customerName,
      phone,
      address,
      scheduledAt,
      serviceType,
      deliveryPoint: serviceType === "ANTAR" ? deliveryPoint : null,
      deliveryMapUrl:
        serviceType === "ANTAR" ? rawMapUrl || null : null,
      source: source || null,
      note: note || null,
      shippingCost: totals.shippingCost,
      subtotal: totals.subtotal,
      total: totals.total,
      status: parseStatus(input.status),
    };

    let saved: { id: string; code: string } | null = null;
    let codeAttempt = 0;
    let forcePreOrder = false;

    while (!saved && codeAttempt < MAX_CODE_ATTEMPTS) {
      try {
        saved = await prisma.$transaction(async (tx) => {
          let code = existing?.code;

          if (!code) {
            const now = new Date();
            const startOfDay = jakartaStartOfDay(now);
            const startOfNextDay = new Date(
              startOfDay.getTime() + 24 * 60 * 60 * 1000,
            );

            const todayCount = await tx.order.count({
              where: { createdAt: { gte: startOfDay, lt: startOfNextDay } },
            });

            code = `${codePrefix(now)}-${String(todayCount + 1).padStart(3, "0")}`;
          }

          const dbItemQueues = new Map<string, ExistingOrderItem[]>();

          for (const item of existing?.items ?? []) {
            const key = itemKey(item);
            const queue = dbItemQueues.get(key) ?? [];
            queue.push(item);
            dbItemQueues.set(key, queue);
          }

          const itemPlans = resolvedItems.map((resolved) => ({
            resolved,
            existingItem: dbItemQueues.get(itemKey(resolved))?.shift() ?? null,
          }));
          const itemsToCreate: OrderItemCreateData[] = [];
          const idsToDelete = Array.from(dbItemQueues.values())
            .flat()
            .map((item) => item.id);
          const existingItemIds = (existing?.items ?? []).map((item) => item.id);

          const previousMovementSums = existingItemIds.length
            ? await tx.variantStockMovement.groupBy({
                by: ["orderItemId", "type"],
                where: {
                  orderItemId: { in: existingItemIds },
                  type: { in: ["OUT", "IN"] },
                },
                _sum: { qty: true },
              })
            : [];
          const stockNetByItem = new Map<string, number>();

          for (const movement of previousMovementSums) {
            if (!movement.orderItemId) continue;

            const signed =
              movement.type === "OUT"
                ? (movement._sum.qty ?? 0)
                : -(movement._sum.qty ?? 0);
            stockNetByItem.set(
              movement.orderItemId,
              (stockNetByItem.get(movement.orderItemId) ?? 0) + signed,
            );
          }

          const isFulfillmentLocked = existing?.status === "SELESAI";
          let fulfillmentType: FulfillmentType = "PRE_ORDER";

          if (
            !isFulfillmentLocked &&
            !forcePreOrder &&
            isTodayWib(scheduledAt)
          ) {
            const stockVariantIds = Array.from(
              new Set([
                ...resolvedItems.flatMap((item) =>
                  item.variantId ? [item.variantId] : [],
                ),
                ...(existing?.items.flatMap((item) =>
                  item.variantId ? [item.variantId] : [],
                ) ?? []),
              ]),
            );
            const stockRows = stockVariantIds.length
              ? await tx.productVariant.findMany({
                  where: { id: { in: stockVariantIds } },
                  select: { id: true, stockQty: true },
                })
              : [];
            const stockByVariant: Record<string, number> = Object.fromEntries(
              stockRows.map((variant) => [variant.id, variant.stockQty]),
            );

            for (const item of existing?.items ?? []) {
              if (!item.variantId) continue;
              stockByVariant[item.variantId] =
                (stockByVariant[item.variantId] ?? 0) +
                (stockNetByItem.get(item.id) ?? 0);
            }

            const stockAvailable = canFulfillFromStock(
              resolvedItems,
              stockByVariant,
            );

            if (origin === "WEB" && !stockAvailable) {
              const requiredByVariant = new Map<string, number>();

              for (const item of resolvedItems) {
                if (!item.variantId) continue;
                requiredByVariant.set(
                  item.variantId,
                  (requiredByVariant.get(item.variantId) ?? 0) + item.quantity,
                );
              }

              const shortages: string[] = [];

              for (const [variantId, required] of requiredByVariant) {
                const shortage = required - (stockByVariant[variantId] ?? 0);

                if (shortage > 0) {
                  const name = variantMap.get(variantId)?.name ?? variantId;
                  shortages.push(`${name} kurang ${shortage}`);
                }
              }

              throw new Error(
                `Stok hari ini tidak cukup${shortages.length ? `: ${shortages.join(", ")}` : ""}. Pilih pre-order mulai ${minimumPreOrderDate()}.`,
              );
            }

            if (stockAvailable) {
              fulfillmentType = "STOCK";
            }
          }

          if (isFulfillmentLocked) {
            if (
              itemPlans.some(
                ({ existingItem }) => !existingItem?.fulfillmentType,
              )
            ) {
              throw new Error(
                "Snapshot pemenuhan pesanan selesai belum lengkap dan perlu ditinjau admin.",
              );
            }
          } else if (fulfillmentType === "STOCK") {
            const currentTasks = await tx.productionTask.findMany({
              where: {
                orderItemId: {
                  in: itemPlans.flatMap(({ existingItem }) =>
                    existingItem ? [existingItem.id] : [],
                  ),
                },
              },
              select: { stage: true },
            });

            if (currentTasks.some((task) => task.stage !== "ANTRI")) {
              throw new Error(
                "Pesanan sudah mulai diproduksi dan tidak dapat dialihkan ke stok hari ini.",
              );
            }
          }

          const order = existing
            ? await tx.order.update({
                where: { id: existing.id },
                data: orderData,
                select: { id: true, code: true },
              })
            : await tx.order.create({
                data: { ...orderData, code },
                select: { id: true, code: true },
              });

          for (const { resolved, existingItem } of itemPlans) {
            const itemFulfillmentType = isFulfillmentLocked
              ? existingItem?.fulfillmentType
              : fulfillmentType;

            if (!itemFulfillmentType) {
              throw new Error(
                "Snapshot pemenuhan item belum tersedia. Tinjau data pesanan sebelum menyimpan.",
              );
            }

            if (!existingItem) {
              itemsToCreate.push({
                ...resolved,
                orderId: order.id,
                fulfillmentType: itemFulfillmentType,
              });
              continue;
            }

            if (
              isSameOrderItem(
                existingItem,
                resolved,
                itemFulfillmentType,
              )
            ) {
              continue;
            }

            await tx.orderItem.update({
              where: { id: existingItem.id },
              data: {
                variantId: resolved.variantId,
                productId: resolved.productId,
                productName: resolved.productName,
                variantName: resolved.variantName,
                unitPrice: resolved.unitPrice,
                priceUnit: resolved.priceUnit,
                quantity: resolved.quantity,
                lineTotal: resolved.lineTotal,
                sortOrder: resolved.sortOrder,
                fulfillmentType: itemFulfillmentType,
              },
            });
          }

          if (itemsToCreate.length > 0) {
            await tx.orderItem.createMany({ data: itemsToCreate });
          }

          if (idsToDelete.length > 0) {
            await tx.orderItem.deleteMany({ where: { id: { in: idsToDelete } } });
          }

          const savedItems = await tx.orderItem.findMany({
            where: { orderId: order.id },
            select: {
              id: true,
              variantId: true,
              productId: true,
              productName: true,
              variantName: true,
              quantity: true,
              fulfillmentType: true,
            },
          });

          if (!isFulfillmentLocked) {
            const preorderItemIds = savedItems
              .filter((item) => item.fulfillmentType === "PRE_ORDER")
              .map((item) => item.id);
            const stockItemIds = savedItems
              .filter((item) => item.fulfillmentType === "STOCK")
              .map((item) => item.id);

            if (stockItemIds.length > 0) {
              const stockTasks = await tx.productionTask.findMany({
                where: { orderItemId: { in: stockItemIds } },
                select: { stage: true },
              });

              if (stockTasks.some((task) => task.stage !== "ANTRI")) {
                throw new Error(
                  "Pesanan sudah mulai diproduksi dan tidak dapat dialihkan ke stok hari ini.",
                );
              }

              if (stockTasks.length > 0) {
                const deletedTasks = await tx.productionTask.deleteMany({
                  where: {
                    orderItemId: { in: stockItemIds },
                    stage: "ANTRI",
                  },
                });

                if (deletedTasks.count !== stockTasks.length) {
                  throw new Error(
                    "Tahap produksi berubah saat pesanan disimpan. Muat ulang lalu coba lagi.",
                  );
                }
              }
            }

            if (preorderItemIds.length > 0) {
              await tx.productionTask.createMany({
                data: preorderItemIds.map((orderItemId) => ({
                  orderId: order.id,
                  orderItemId,
                  scheduledAt,
                })),
                skipDuplicates: true,
              });

              await tx.productionTask.updateMany({
                where: {
                  orderItemId: { in: preorderItemIds },
                  scheduledAt: { not: scheduledAt },
                },
                data: { scheduledAt },
              });
            }

            const allItemIds = Array.from(
              new Set([...existingItemIds, ...savedItems.map((item) => item.id)]),
            );
            const movementSums = allItemIds.length
              ? await tx.variantStockMovement.groupBy({
                  by: ["orderItemId", "type"],
                  where: {
                    orderItemId: { in: allItemIds },
                    type: { in: ["OUT", "IN"] },
                  },
                  _sum: { qty: true },
                })
              : [];
            const currentNetByItem = new Map<string, number>();

            for (const movement of movementSums) {
              if (!movement.orderItemId) continue;

              const signed =
                movement.type === "OUT"
                  ? (movement._sum.qty ?? 0)
                  : -(movement._sum.qty ?? 0);
              currentNetByItem.set(
                movement.orderItemId,
                (currentNetByItem.get(movement.orderItemId) ?? 0) + signed,
              );
            }

            const variantByItem = new Map<string, string>();
            for (const item of existing?.items ?? []) {
              if (item.variantId) variantByItem.set(item.id, item.variantId);
            }
            const targetStockByItem = new Map<string, number>();

            for (const item of savedItems) {
              if (item.variantId) variantByItem.set(item.id, item.variantId);
              if (item.fulfillmentType === "STOCK") {
                targetStockByItem.set(item.id, item.quantity);
              }
            }

            for (const itemId of allItemIds) {
              const delta =
                (targetStockByItem.get(itemId) ?? 0) -
                (currentNetByItem.get(itemId) ?? 0);

              if (delta === 0) continue;

              const variantId = variantByItem.get(itemId);
              if (!variantId) {
                throw new Error(
                  "Varian untuk pergerakan stok pesanan tidak ditemukan.",
                );
              }

              try {
                await recordStockMovement(tx, {
                  variantId,
                  type: delta > 0 ? "OUT" : "IN",
                  qty: Math.abs(delta),
                  orderItemId: itemId,
                  note: `Nota ${code}`,
                });
              } catch (error) {
                if (
                  error instanceof Error &&
                  error.message === "Stok varian tidak cukup."
                ) {
                  const variant = variantMap.get(variantId);
                  throw new StockAvailabilityChangedError(
                    `Stok "${variant?.name ?? variantId}" berubah saat pesanan disimpan.`,
                  );
                }

                throw error;
              }
            }
          }

          let finalStatus = orderData.status;

          if (finalStatus === "SELESAI_PRODUKSI") {
            const pending = await tx.productionTask.count({
              where: { orderId: order.id, stage: { not: "SIAP" } },
            });

            if (pending > 0) {
              await tx.order.update({
                where: { id: order.id },
                data: { status: "DIPROSES" },
                select: { id: true },
              });
              finalStatus = "DIPROSES";
            }
          }

          if (finalStatus === "SELESAI_PRODUKSI" || finalStatus === "SELESAI") {
            await deductIngredientsForOrder(tx, order.id);
          }

          return order;
        }, TX_OPTIONS);
      } catch (error) {
        if (
          origin === "ADMIN" &&
          !forcePreOrder &&
          error instanceof StockAvailabilityChangedError
        ) {
          forcePreOrder = true;
          continue;
        }

        if (!existing && isCodeConflict(error) && codeAttempt < MAX_CODE_ATTEMPTS - 1) {
          codeAttempt += 1;
          continue;
        }

        throw error;
      }

      if (!saved) {
        codeAttempt += 1;
      }
    }

    if (!saved) {
      throw new Error("Gagal membuat kode pesanan. Coba simpan sekali lagi.");
    }

    return { ok: true, id: saved.id, code: saved.code };
  } catch (error) {
    console.error("saveOrderCore", error);

    if (isTransactionExpired(error)) {
      return {
        ok: false,
        error:
          "Server sedang lambat saat menyimpan pesanan. Data belum tersimpan — silakan simpan sekali lagi.",
      };
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan pesanan.",
    };
  }
}
