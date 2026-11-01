/**
 * Tipe & helper murni untuk modul Pesanan.
 *
 * Harus bebas dari import server-only agar form admin (client component) bisa
 * memakai label, perhitungan total, dan format rupiah yang sama dengan server.
 */

/** Semua tanggal & waktu di aplikasi mengikuti WIB. */
export const JAKARTA_TIME_ZONE = "Asia/Jakarta";

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
  /** Format YYYY-MM-DD. */
  scheduledAt: string | null;
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
  scheduledAt: Date | null;
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

export type OrderSourceOption = {
  source: string;
  count: number;
};

/**
 * Pelanggan yang sudah pernah memesan — dipakai untuk autocomplete nama
 * pemesan supaya no. HP dan alamat bisa terisi otomatis.
 */
export type OrderCustomerOption = {
  name: string;
  phone: string;
  address: string;
  orderCount: number;
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
    timeZone: JAKARTA_TIME_ZONE,
  }).format(value);
}

/**
 * Tanggal jadwal disimpan sebagai kolom DATE (tanpa zona waktu). Format WIB
 * dipakai agar tanggal tetap sama baik dibaca sebagai 00:00 UTC maupun 00:00 WIB.
 */
export function formatDateOnly(value: Date | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: JAKARTA_TIME_ZONE,
  }).format(value);
}

/** Tanggal WIB dalam format YYYY-MM-DD. */
export function jakartaDateKey(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Instant UTC untuk pukul 00:00 WIB pada tanggal tersebut. */
export function jakartaStartOfDay(value: Date): Date {
  return new Date(`${jakartaDateKey(value)}T00:00:00+07:00`);
}

/** Instant UTC untuk tanggal 1 pukul 00:00 WIB pada bulan tersebut. */
export function jakartaStartOfMonth(value: Date): Date {
  return new Date(`${jakartaDateKey(value).slice(0, 7)}-01T00:00:00+07:00`);
}

/** Bulan WIB (`YYYY-MM`) dari sebuah instant. */
export function jakartaMonthKey(value: Date): string {
  return jakartaDateKey(value).slice(0, 7);
}

export function isMonthKeyValue(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

/** Geser bulan, mis. ("2026-01", -1) -> "2025-12". */
export function shiftMonthKeyValue(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));

  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** "2026-11" -> "November 2026". */
export function monthKeyLabel(monthKey: string, format: "long" | "short" = "long"): string {
  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    month: format,
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/**
 * Rentang satu bulan WIB: `start` inklusif, `end` eksklusif (awal bulan
 * berikutnya) supaya query bisa memakai `gte`/`lt` tanpa menghitung hari.
 */
export function monthRangeFromKey(monthKey: string): {
  start: Date;
  end: Date;
} {
  const [year, month] = monthKey.split("-").map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return {
    start: new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+07:00`),
    end: new Date(
      `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+07:00`,
    ),
  };
}

export function jakartaMonthRange(value: Date): { start: Date; end: Date } {
  return monthRangeFromKey(jakartaMonthKey(value));
}

/** Nilai untuk <input type="date"> berdasarkan tanggal WIB. */
export function toDateInputValue(value: Date | null | undefined): string {
  return value ? jakartaDateKey(value) : "";
}
