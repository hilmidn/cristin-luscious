/**
 * Tipe & helper murni untuk modul Produksi.
 *
 * Bebas dari import server-only karena dipakai juga oleh komponen client
 * (stepper tahap) dan grid kalender.
 */

import { JAKARTA_TIME_ZONE, jakartaDateKey } from "./order-types";

export type ProductionStage =
  | "ANTRI"
  | "DISIAPKAN"
  | "DIPRODUKSI"
  | "DIKEMAS"
  | "SIAP";

export const PRODUCTION_STAGES: ProductionStage[] = [
  "ANTRI",
  "DISIAPKAN",
  "DIPRODUKSI",
  "DIKEMAS",
  "SIAP",
];

export const PRODUCTION_STAGE_LABELS: Record<ProductionStage, string> = {
  ANTRI: "Antri",
  DISIAPKAN: "Disiapkan",
  DIPRODUKSI: "Diproduksi",
  DIKEMAS: "Dikemas",
  SIAP: "Siap",
};

export function stageIndex(stage: ProductionStage): number {
  const index = PRODUCTION_STAGES.indexOf(stage);

  return index < 0 ? 0 : index;
}

export function nextStage(stage: ProductionStage): ProductionStage | null {
  return PRODUCTION_STAGES[stageIndex(stage) + 1] ?? null;
}

export function previousStage(stage: ProductionStage): ProductionStage | null {
  const index = stageIndex(stage) - 1;

  return index >= 0 ? PRODUCTION_STAGES[index] : null;
}

/** Kunci grup kerja dapur: satu produk pada satu tanggal produksi. */
export function productionProductKey(
  productId: string | null,
  productName: string,
): string {
  return productId ? `product:${productId}` : `name:${productName}`;
}

/**
 * Satu grup kerja dapur = satu produk dalam satu tanggal produksi.
 * Daftar varian merangkum quantity; semua task produk memakai tahap yang sama.
 */
export type ProductionGroup = {
  key: string;
  productName: string;
  variants: {
    key: string;
    variantName: string | null;
    quantity: number;
  }[];
  /** Total quantity seluruh item di grup. */
  quantity: number;
  /** Jumlah pesanan berbeda yang memesan produk ini. */
  orderCount: number;
  /** Semua task yang ikut berubah saat tahap grup diubah. */
  taskIds: string[];
  stage: ProductionStage;
};

export type ProductionDay = {
  dateKey: string;
  groups: ProductionGroup[];
  itemCount: number;
  orderCount: number;
};

/** Ringkasan isi satu sel kalender. */
export type ProductionDaySummary = {
  orderCount: number;
  itemCount: number;
  /** Produk terbanyak lebih dulu, maksimal 2 baris untuk sel. */
  highlights: { name: string; quantity: number }[];
  /** true bila semua item hari itu sudah SIAP. */
  allReady: boolean;
};

export type ProductionMonth = {
  monthKey: string;
  days: Record<string, ProductionDaySummary>;
};

/* ------------------------------------------------------------------ */
/* Helper tanggal (semua berbasis WIB)                                 */
/* ------------------------------------------------------------------ */

export function todayKey(now: Date = new Date()): string {
  return jakartaDateKey(now);
}

export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function isMonthKey(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

export function isDateKey(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

/** Geser bulan, mis. ("2026-11", -1) -> "2026-10". */
export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));

  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatDayLabel(dateKey: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

/** Grid kalender Senin–Minggu untuk satu bulan. */
export function buildMonthGrid(monthKey: string): {
  dateKey: string;
  day: number;
  inMonth: boolean;
}[] {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  // getUTCDay: Minggu=0; ubah agar Senin=0.
  const leading = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, 1 - leading + index));

    return {
      dateKey: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`,
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month - 1,
    };
  });
}

export const PRODUCTION_WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export { JAKARTA_TIME_ZONE };
