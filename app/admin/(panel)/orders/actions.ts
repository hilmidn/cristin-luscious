"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  calculateOrderTotals,
  isMapUrl,
  isValidPhone,
  normalizePhone,
  ORDER_STATUSES,
  SERVICE_TYPES,
  type OrderInput,
  type OrderStatus,
  type ServiceType,
} from "@/lib/order-types";

export type SaveOrderResult =
  | { ok: true; id: string; code: string }
  | { ok: false; error: string };

export type SimpleActionResult = { ok: true } | { ok: false; error: string };

const MAX_NAME = 120;
const MAX_ADDRESS = 500;
const MAX_SOURCE = 60;
const MAX_NOTE = 500;
const MAX_QUANTITY = 999;
const MAX_CODE_ATTEMPTS = 5;

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Sesi admin tidak valid. Silakan login ulang.");
  }
}

function revalidateOrders(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");

  if (id) {
    revalidatePath(`/admin/orders/${id}`);
  }
}

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

function codePrefix(date: Date) {
  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `CL-${year}${month}${day}`;
}

export async function saveOrder(input: OrderInput): Promise<SaveOrderResult> {
  try {
    await requireAdmin();

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
          select: { id: true, code: true },
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
            const startOfDay = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            );
            const startOfNextDay = new Date(startOfDay);
            startOfNextDay.setDate(startOfNextDay.getDate() + 1);

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

          await tx.orderItem.deleteMany({ where: { orderId: order.id } });
          await tx.orderItem.createMany({
            data: resolvedItems.map((item) => ({
              ...item,
              orderId: order.id,
            })),
          });

          return order;
        });
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

    revalidateOrders(saved.id);

    return { ok: true, id: saved.id, code: saved.code };
  } catch (error) {
    console.error("saveOrder", error);

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan pesanan.",
    };
  }
}

export async function deleteOrder(id: string): Promise<SimpleActionResult> {
  try {
    await requireAdmin();

    const order = await getPrisma().order.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!order) {
      return { ok: false, error: "Pesanan tidak ditemukan." };
    }

    await getPrisma().order.delete({ where: { id } });
    revalidateOrders();

    return { ok: true };
  } catch (error) {
    console.error("deleteOrder", error);
    return { ok: false, error: "Gagal menghapus pesanan." };
  }
}

export async function setOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();

    if (!ORDER_STATUSES.includes(status)) {
      return { ok: false, error: "Status tidak valid." };
    }

    await getPrisma().order.update({
      where: { id },
      data: { status },
      select: { id: true },
    });

    revalidateOrders(id);

    return { ok: true };
  } catch (error) {
    console.error("setOrderStatus", error);
    return { ok: false, error: "Gagal mengubah status pesanan." };
  }
}
