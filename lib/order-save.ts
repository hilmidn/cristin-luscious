import "server-only";

import {
  calculateOrderTotals,
  isMapUrl,
  isValidPhone,
  jakartaDateKey,
  jakartaStartOfDay,
  normalizePhone,
  ORDER_STATUSES,
  SERVICE_TYPES,
  type OrderInput,
  type OrderStatus,
  type ServiceType,
} from "@/lib/order-types";
import { getPrisma, TX_OPTIONS } from "@/lib/prisma";

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

  if (Number.isNaN(date.getTime())) {
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
};

type ExistingOrderItem = Omit<OrderItemCreateData, "orderId"> & { id: string };

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
function isSameOrderItem(current: ExistingOrderItem, next: ResolvedItem) {
  return (
    current.productId === next.productId &&
    current.variantId === next.variantId &&
    current.productName === next.productName &&
    current.variantName === next.variantName &&
    current.unitPrice === next.unitPrice &&
    current.priceUnit === next.priceUnit &&
    current.quantity === next.quantity &&
    current.sortOrder === next.sortOrder &&
    current.lineTotal === next.lineTotal
  );
}

function codePrefix(date: Date) {
  // Tanggal WIB, bukan zona waktu server.
  const [year, month, day] = jakartaDateKey(date).split("-");

  return `CL-${year.slice(2)}${month}${day}`;
}

export async function saveOrderCore(input: OrderInput): Promise<SaveOrderResult> {
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
    if (!address) throw new Error("Alamat wajib diisi.");
    if (address.length > MAX_ADDRESS) {
      throw new Error(`Alamat maksimal ${MAX_ADDRESS} karakter.`);
    }

    const serviceType = parseServiceType(input.serviceType);

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

    const resolvedItems: ResolvedItem[] = input.items.map((item, index) => {
      const quantity = parseQuantity(item.quantity);

      // Varian: nama & harga selalu diambil dari database, bukan dari client.
      if (item.variantId) {
        const variant = variantMap.get(item.variantId);

        if (!variant) {
          throw new Error(
            "Varian yang dipilih tidak ditemukan. Muat ulang halaman lalu coba lagi.",
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
            "Produk yang dipilih tidak ditemukan. Muat ulang halaman lalu coba lagi.",
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
              },
            },
          },
        })
      : null;

    if (input.id && !existing) {
      return { ok: false, error: "Pesanan tidak ditemukan." };
    }

    let saved: { id: string; code: string } | null = null;

    for (
      let attempt = 0;
      attempt < MAX_CODE_ATTEMPTS && !saved;
      attempt += 1
    ) {
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

          // Item di-update berdasarkan id (bukan delete-recreate) supaya
          // production_tasks yang menempel tidak kehilangan progres.
          // 1. Antrekan item lama per varian/produk.
          const dbItemQueues = new Map<string, ExistingOrderItem[]>();

          for (const item of existing?.items ?? []) {
            const key = itemKey(item);
            const queue = dbItemQueues.get(key) ?? [];
            queue.push(item);
            dbItemQueues.set(key, queue);
          }

          // 2. Item yang berubah di-update, sisanya (termasuk semua item pada
          //    pesanan baru) dibuat sekaligus lewat satu `createMany`.
          const itemsToCreate: OrderItemCreateData[] = [];

          for (const resolved of resolvedItems) {
            const existingItem = dbItemQueues.get(itemKey(resolved))?.shift();

            if (!existingItem) {
              itemsToCreate.push({ ...resolved, orderId: order.id });
              continue;
            }

            if (isSameOrderItem(existingItem, resolved)) {
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
              },
            });
          }

          if (itemsToCreate.length > 0) {
            await tx.orderItem.createMany({ data: itemsToCreate });
          }

          // 3. Hapus item yang sudah tidak ada di form. Task ikut terhapus
          //    lewat onDelete: Cascade.
          const idsToDelete = Array.from(dbItemQueues.values())
            .flat()
            .map((item) => item.id);

          if (idsToDelete.length > 0) {
            await tx.orderItem.deleteMany({ where: { id: { in: idsToDelete } } });
          }

          // 4. Satu task produksi per item. Tanggal kerja mengikuti tanggal
          //    ambil/kirim pesanan; tahap yang sudah berjalan dipertahankan.
          //    Pembuatan & sinkron tanggal dilakukan sekaligus (bukan upsert
          //    per item) supaya tidak menambah round-trip per item.
          const savedItems = await tx.orderItem.findMany({
            where: { orderId: order.id },
            select: { id: true },
          });

          if (savedItems.length > 0) {
            await tx.productionTask.createMany({
              data: savedItems.map((item) => ({
                orderId: order.id,
                orderItemId: item.id,
                scheduledAt,
              })),
              skipDuplicates: true,
            });

            await tx.productionTask.updateMany({
              where: { orderId: order.id, scheduledAt: { not: scheduledAt } },
              data: { scheduledAt },
            });
          }

          // Bila nota sebelumnya sudah selesai produksi lalu ditambah item
          // baru, produksi otomatis dibuka lagi agar task tidak menggantung.
          if (orderData.status === "SELESAI_PRODUKSI") {
            const pending = await tx.productionTask.count({
              where: { orderId: order.id, stage: { not: "SIAP" } },
            });

            if (pending > 0) {
              await tx.order.update({
                where: { id: order.id },
                data: { status: "DIPROSES" },
                select: { id: true },
              });
            }
          }

          return order;
        }, TX_OPTIONS);
      } catch (error) {
        if (!existing && isCodeConflict(error) && attempt < MAX_CODE_ATTEMPTS - 1) {
          continue;
        }

        throw error;
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
