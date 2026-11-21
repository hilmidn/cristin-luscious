/**
 * Audit klasifikasi pemenuhan OrderItem lama — Batch 1 plan
 * docs/plans/2026-11-21-dynamic-stock-preorder.md.
 *
 * Klasifikasi dari BUKTI yang tersedia di database:
 *   PRE_ORDER : punya ProductionTask (item masuk kalender produksi)
 *   STOCK     : punya VariantStockMovement type OUT (stok jadi keluar)
 *   KONFLIK   : punya keduanya (item pernah diedit klasifikasinya) -> ditinjau
 *   TANPA BUKTI: tidak ada task maupun movement OUT -> ditinjau
 *
 * Migration backfill mengisi PRE_ORDER/STOCK dan membiarkan KONFLIK/TANPA
 * BUKTI tetap NULL — daftarnya dicetak di bagian akhir supaya bisa ditinjau
 * satu per satu sebelum kolom dibuat wajib.
 *
 * Jalankan di mesin yang punya .env.local / .env dengan DATABASE_URL:
 *   npx tsx scripts/audit-fulfillment.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL tidak ditemukan di .env.local / .env");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
  log: ["error"],
});

type Kategori = "STOCK" | "PRE_ORDER" | "KONFLIK" | "TANPA_BUKTI";

function formatTanggal(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : "-";
}

async function main() {
  const items = await prisma.orderItem.findMany({
    select: {
      id: true,
      variantId: true,
      productName: true,
      variantName: true,
      quantity: true,
      fulfillmentType: true,
      order: { select: { code: true, status: true, scheduledAt: true } },
      productionTask: { select: { createdAt: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const itemIds = items.map((item) => item.id);

  const movements = itemIds.length
    ? await prisma.variantStockMovement.findMany({
        where: { orderItemId: { in: itemIds } },
        select: { orderItemId: true, type: true, createdAt: true },
      })
    : [];

  const outCount = new Map<string, number>();
  const otherCount = new Map<string, number>();
  const lastOutAt = new Map<string, Date>();
  const lastTaskAt = new Map<string, Date>();

  for (const move of movements) {
    if (!move.orderItemId) continue;

    if (move.type === "OUT") {
      outCount.set(move.orderItemId, (outCount.get(move.orderItemId) ?? 0) + 1);
      const sebelum = lastOutAt.get(move.orderItemId);
      if (!sebelum || move.createdAt > sebelum) {
        lastOutAt.set(move.orderItemId, move.createdAt);
      }
    } else {
      otherCount.set(
        move.orderItemId,
        (otherCount.get(move.orderItemId) ?? 0) + 1,
      );
    }
  }

  for (const item of items) {
    if (item.productionTask) {
      lastTaskAt.set(item.id, item.productionTask.createdAt);
    }
  }

  const jumlah = {
    STOCK: 0,
    PRE_ORDER: 0,
    KONFLIK: 0,
    TANPA_BUKTI: 0,
  } as Record<Kategori, number>;

  const perStatus = new Map<string, Record<Kategori, number>>();
  const perluTinjau: Array<{
    kode: string;
    status: string;
    jadwal: string;
    produk: string;
    varian: string;
    qty: number;
    kategori: Kategori;
    fulfillmentType: string;
    task: number;
    out: number;
    lain: number;
  }> = [];

  for (const item of items) {
    const hasTask = Boolean(item.productionTask);
    const hasOut = (outCount.get(item.id) ?? 0) > 0;

    let kategori: Kategori;

    if (hasTask && hasOut) {
      kategori = "KONFLIK";
    } else if (hasTask) {
      kategori = "PRE_ORDER";
    } else if (hasOut) {
      kategori = "STOCK";
    } else {
      kategori = "TANPA_BUKTI";
    }

    jumlah[kategori] += 1;

    const statusKey = item.order.status;
    const rowStatus =
      perStatus.get(statusKey) ??
      { STOCK: 0, PRE_ORDER: 0, KONFLIK: 0, TANPA_BUKTI: 0 };
    rowStatus[kategori] += 1;
    perStatus.set(statusKey, rowStatus);

    if (kategori === "KONFLIK" || kategori === "TANPA_BUKTI") {
      perluTinjau.push({
        kode: item.order.code,
        status: item.order.status,
        jadwal: formatTanggal(item.order.scheduledAt),
        produk: item.productName,
        varian: item.variantName,
        qty: item.quantity,
        kategori,
        fulfillmentType: item.fulfillmentType ?? "NULL",
        task: hasTask ? 1 : 0,
        out: outCount.get(item.id) ?? 0,
        lain: otherCount.get(item.id) ?? 0,
      });
    }
  }

  console.log("=== AUDIT FULFILLMENT OrderItem ===");
  console.log(`Total item           : ${items.length}`);
  console.log(`STOCK (ada OUT)      : ${jumlah.STOCK}`);
  console.log(`PRE_ORDER (ada task) : ${jumlah.PRE_ORDER}`);
  console.log(`KONFLIK (task+OUT)   : ${jumlah.KONFLIK}`);
  console.log(`TANPA BUKTI          : ${jumlah.TANPA_BUKTI}`);
  console.log(
    `Item custom (tanpa varian): ${
      items.filter((item) => !item.variantId).length
    }`,
  );

  console.log("\n=== Per status order ===");
  for (const [status, row] of [...perStatus.entries()].sort()) {
    console.log(
      `${status.padEnd(18)} STOCK=${row.STOCK}  PRE_ORDER=${row.PRE_ORDER}  KONFLIK=${row.KONFLIK}  TANPA_BUKTI=${row.TANPA_BUKTI}`,
    );
  }

  // Kolom fulfillmentType (setelah migration dijalankan): distribusinya harus
  // cocok dengan kategori bukti; NULL tersisa = KONFLIK + TANPA BUKTI.
  const kolom = new Map<string, number>();
  for (const item of items) {
    const key = item.fulfillmentType ?? "NULL";
    kolom.set(key, (kolom.get(key) ?? 0) + 1);
  }
  console.log("\n=== Kolom OrderItem.fulfillmentType saat ini ===");
  for (const [key, count] of [...kolom.entries()].sort()) {
    console.log(`${key.padEnd(12)} : ${count}`);
  }

  if (perluTinjau.length > 0) {
    console.log(
      `\n=== PERLU TINJAU (${perluTinjau.length} item) — task/out/lain = jumlah bukti ===`,
    );
    console.log(
      "kode                 status              jadwal      qty  kategori     kolom   task out lain  produk / varian",
    );

    for (const row of perluTinjau.slice(0, 100)) {
      console.log(
        [
          row.kode.padEnd(20),
          row.status.padEnd(18),
          row.jadwal.padEnd(12),
          String(row.qty).padStart(3),
          row.kategori.padEnd(12),
          row.fulfillmentType.padEnd(7),
          String(row.task).padStart(4),
          String(row.out).padStart(3),
          String(row.lain).padStart(4),
          `${row.produk} / ${row.varian}`,
        ].join("  "),
      );
    }

    if (perluTinjau.length > 100) {
      console.log(`... dan ${perluTinjau.length - 100} item lainnya.`);
    }
  } else {
    console.log("\n✅ Tidak ada item KONFLIK maupun TANPA BUKTI.");
  }

  console.log(
    "\nCatatan: migration backfill mengisi PRE_ORDER/STOCK dari bukti terakhir;",
    "baris KONFLIK dan TANPA BUKTI sengaja dibiarkan NULL untuk ditinjau manual.",
  );
}

void main();
