/**
 * Tipe & helper murni untuk modul Pesanan.
 *
 * Harus bebas dari import server-only agar form admin (client component) bisa
 * memakai label, perhitungan total, dan format rupiah yang sama dengan server.
 */

export type ServiceType = "PICKUP" | "ANTAR";

export type OrderStatus = "BARU" | "DIPROSES" | "SELESAI" | "DIBATALKAN";

export const SERVICE_TYPES: ServiceType[] = ["PICKUP", "ANTAR"];

export const SERVICE_LABELS: Record<ServiceType, string> = {
  PICKUP: "Pickup",
  ANTAR: "Antar",
};

export const ORDER_STATUSES: OrderStatus[] = [
  "BARU",
  "DIPROSES",
  "SELESAI",
  "DIBATALKAN",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  BARU: "Baru",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export type OrderItemInput = {
  id?: string;
  variantId: string | null;
  productId: string | null;
  /** Snapshot dari client, hanya dipakai bila varian/produk sudah dihapus. */
  productName: string;
  variantName: string;
  unitPrice: number | null;
  priceUnit: string | null;
  quantity: number;
  sortOrder: number;
};

export type OrderInput = {
  id?: string;
  customerName: string;
  phone: string;
  address: string;
  serviceType: ServiceType;
  deliveryPoint: string | null;
  deliveryMapUrl: string | null;
  source: string | null;
  note: string | null;
  shippingCost: number;
  status: OrderStatus;
  items: OrderItemInput[];
};

export type AdminOrderItem = {
  id: string;
  variantId: string | null;
  productId: string | null;
  productName: string;
  variantName: string;
  unitPrice: number | null;
  priceUnit: string | null;
  quantity: number;
  lineTotal: number;
};

export type AdminOrder = {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  address: string;
  serviceType: ServiceType;
  deliveryPoint: string | null;
  deliveryMapUrl: string | null;
  source: string | null;
  note: string | null;
  shippingCost: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  items: AdminOrderItem[];
};

export type AdminOrderListItem = {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  serviceType: ServiceType;
  source: string | null;
  status: OrderStatus;
  total: number;
  itemCount: number;
  unitCount: number;
  createdAt: Date;
};

export type OrderSourceOption = {
  source: string;
  count: number;
};

export type OrderableVariant = {
  id: string;
  name: string;
  price: number | null;
  priceUnit: string | null;
};

export type OrderableProduct = {
  id: string;
  name: string;
  variants: OrderableVariant[];
};

/** Rupiah tanpa desimal, mis. 45000 -> "Rp 45.000". */
export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(value))}`;
}

/**
 * Subtotal = jumlah (harga satuan x jumlah). Item tanpa harga dihitung 0 dan
 * tetap tampil sebagai "harga menyusul" di invoice.
 */
export function calculateOrderTotals(
  items: { unitPrice: number | null; quantity: number }[],
  shippingCost = 0,
): { subtotal: number; shippingCost: number; total: number } {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity || 0),
    0,
  );
  const shipping = Number.isFinite(shippingCost) ? Math.round(shippingCost) : 0;

  return { subtotal, shippingCost: shipping, total: subtotal + shipping };
}

/** Normalisasi nomor HP Indonesia ke format 08xx. */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("62")) {
    return `0${digits.slice(2)}`;
  }

  if (digits.startsWith("8")) {
    return `0${digits}`;
  }

  return digits;
}

export function isValidPhone(value: string): boolean {
  return /^0\d{8,13}$/.test(normalizePhone(value));
}

/** Link lokasi harus http(s); kosong dianggap tidak diisi. */
export function isMapUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function formatOrderDate(value: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}
