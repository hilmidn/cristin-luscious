# Plan: Kalender Produksi & Tahapan Pesanan

Status: **rencana, belum diimplementasi**
Tanggal: 2026-10-31
Bergantung pada: modul Pesanan (sudah jadi: `Order`, `OrderItem`, `scheduledAt`, status `BARU/DIPROSES/SELESAI/DIBATALKAN`).

## 1. Masalah

Sistem ini pre-order: pesanan dicatat hari ini, barang diambil/dikirim pada
`scheduledAt`. Saat ini admin hanya punya daftar pesanan; tidak ada jawaban cepat
untuk pertanyaan dapur:

- "Tanggal 3 besok harus bikin apa saja, berapa banyak?"
- "Pesanan CL-... sudah sampai tahap mana?"
- "Ada yang jadwalnya hari ini tapi belum siap?"

Karena itu perlu lapisan kerja dapur, terpisah dari daftar pesanan.

## 2. Konsep kunci

1. **Unit kerja = item pesanan, bukan pesanan.** Satu pesanan bisa berisi
   cheesecake dan cookies yang dibuat di waktu berbeda.
2. **Tanggal kerja = `Order.scheduledAt`** (tanggal ambil/kirim). Tidak ada input
   tanggal baru yang perlu diisi admin.
3. **Tahapan hanya untuk pesanan aktif.** Pesanan `BARU`/`DIPROSES` muncul di
   kalender; `SELESAI`/`DIBATALKAN` hilang otomatis.
4. **Modul ini tidak menggantikan halaman Pesanan.** Pesanan = uang & pelanggan;
   Produksi = "apa yang harus dikerjakan hari itu".

## 3. Pilihan tampilan

### Opsi A — Kalender bulanan (rekomendasi)

Halaman utama `/admin/produksi`: grid kalender satu bulan. Tiap tanggal
menampilkan ringkasan produk yang harus dibuat. Klik tanggal → panel hari.

```text
┌ Produksi ──────────────────────────────────── November 2026 ─┐
│  Sen     Sel     Rab     Kam     Jum     Sab     Min         │
│                                                              │
│                          1       2       3       4       5   │
│                                                              │
│  6       7       8       9      10      11      12            │
│                                                              │
│ 13      14      15      16      17      18      19            │
│                                                              │
│ 20      21      22      23      24      25      26            │
│                                                              │
│ 27      28      29      30                                    │
└──────────────────────────────────────────────────────────────┘

Sel tanggal (contoh 3 Nov):
┌───────────────┐
│ 03      2 ord │
│ Cheesecake ×2 │
│ Cookies   ×1  │
└───────────────┘
```

Klik → panel hari (drawer / halaman `?date=2026-11-03`):

```text
Senin, 03 Nov 2026 · 2 pesanan · 3 item
┌──────────────────────────────────────────────────────────────┐
│ CL-261103-001 · 09:00 · Pickup                               │
│ Cheesecake — Original 16cm                          ×1       │
│ [Antri]—[Disiapkan]—[Diproduksi]—[Dikemas]—[Siap]            │
├──────────────────────────────────────────────────────────────┤
│ CL-261103-002 · 13:00 · Antar                                │
│ Cookies — Chocolate Chip                            ×2       │
│ [Antri]—[Disiapkan]—[Diproduksi]—[Dikemas]—[Siap]            │
└──────────────────────────────────────────────────────────────┘
```

Kelebihan: cocok dengan cara berpikir "tanggal X bikin apa", langsung memakai
`scheduledAt` yang sudah ada. Kekurangan: progres harian harus dibuka per tanggal.

### Opsi B — Papan Kanban per tahap

```text
ANTRI (4) │ DISIAPKAN (2) │ DIPRODUKSI (1) │ DIKEMAS (1) │ SIAP (3)
──────────┼───────────────┼────────────────┼────────────┼────────
Cheesecake│ Cookies       │ Brownies       │ Donut      │ ...
```

Kelebihan: paling jelas untuk progres. Kekurangan: tidak menjawab "tanggal 3
bikin apa"; butuh filter tanggal di atas papan agar berguna.

### Opsi C — Daftar "Hari Ini"

Daftar sederhana: semua item yang jadwalnya hari ini + besok, diurutkan tahap.
Kelebihan: paling cepat dibangun. Kekurangan: tidak bisa melihat ke depan.

### Rekomendasi

**Opsi A sebagai halaman utama**, dengan panel hari yang memuat stepper tahap
(menggabungkan kekuatan Opsi A dan B). Tab "Hari Ini" ditambahkan sebagai filter
cepat, bukan halaman terpisah.

## 4. Model data (draft)

Lihat `plan/produksi/schema-draft.prisma`.

```prisma
enum ProductionStage { ANTRI DISIAPKAN DIPRODUKSI DIKEMAS SIAP }

model ProductionTask {
  id          String  @id @default(cuid())
  orderId     String
  orderItemId String  @unique
  scheduledAt DateTime @db.Date
  stage       ProductionStage @default(ANTRI)
  note        String?
  startedAt   DateTime?
  completedAt DateTime?
  ...
}
```

Keputusan:

- **Satu task = satu `OrderItem`.** Tidak menyimpan nama produk karena
  `OrderItem` sudah menyimpan snapshot `productName`/`variantName`/`quantity`.
- **`scheduledAt` disalin** dari order supaya query kalender tidak perlu join
  berlapis; disinkronkan saat pesanan disimpan.
- **Task dihapus saat order dihapus** (`onDelete: Cascade`). Untuk pesanan
  `DIBATALKAN`, task tidak dihapus tetapi disembunyikan dari kalender (status
  order difilter), supaya riwayat tetap ada.
- **Tidak ada tabel assignment staf** dulu; `admin_users` belum punya peran.

## 5. Prasyarat teknis (penting)

`saveOrder` saat ini menyimpan item dengan cara `deleteMany` lalu `createMany`.
Kalau task terhubung ke `orderItemId`, setiap edit pesanan akan menghapus task
beserta progresnya.

**Perbaikan yang harus dilakukan lebih dulu:** ubah `saveOrder` agar item
di-update berdasarkan `id` (update yang ada, create yang baru, delete hanya yang
benar-benar dihapus dari form) — sama seperti pola varian di `saveProduct`.
Setelah itu task bisa aman memakai `orderItemId @unique`.

## 6. Aturan & alur

- Task dibuat otomatis di `saveOrder` (dalam transaksi yang sama) untuk setiap
  item, dengan `scheduledAt` = tanggal order.
- Ubah tanggal order → `scheduledAt` semua task ikut berubah.
- Tahap hanya bisa maju/mundur satu langkah dari panel hari (tombol "Lanjut" /
  "Kembali"); tidak perlu modal.
- Saat semua task dalam satu order berstatus `SIAP`, tampilkan saran
  "Tandai pesanan selesai" — tidak otomatis, admin tetap memutuskan.
- Item dengan harga menyusul tetap masuk kalender (yang penting jumlah & tanggal).
- Semua perhitungan tanggal memakai WIB (`Asia/Jakarta`), konsisten dengan modul
  Pesanan.

## 7. Halaman & file

Baru:

- `app/admin/(panel)/production/page.tsx` — kalender bulan + panel hari
  (`searchParams`: `?month=YYYY-MM&date=YYYY-MM-DD&view=calendar|today`).
- `components/admin/production/ProductionCalendar.tsx` — grid kalender (server).
- `components/admin/production/ProductionDayPanel.tsx` — daftar item hari itu,
  dikelompokkan per pesanan.
- `components/admin/production/ProductionStageStepper.tsx` — client, tombol
  maju/mundur tahap.
- `components/admin/production/ProductionBadge.tsx` — ringkasan sel tanggal.
- `lib/production-types.ts` — label tahap, tipe, helper agregasi (client-safe).
- `lib/production.ts` — server-only: `getProductionMonth(monthKey)`,
  `getProductionDay(dateKey)`, `getProductionToday()`.
- `app/admin/(panel)/production/actions.ts` — `setProductionStage`,
  `advanceProductionStage` (validasi sesi admin + revalidate).

Diubah:

- `prisma/schema.prisma` — enum + model task, relasi balik di `Order`/`OrderItem`.
- `app/admin/(panel)/orders/actions.ts` — sinkronisasi task + perbaikan update item.
- `components/admin/admin-nav.ts` — grup "Produksi" (setelah Penjualan).
- `AGENTS.md` — konvensi produksi.

## 8. Urutan implementasi

1. Refactor `saveOrder` agar item tidak dihapus-recreate (prasyarat).
2. Schema + migration `production_tasks` + `prisma generate`.
3. `lib/production-types.ts` + `lib/production.ts` (query bulan & hari, WIB).
4. `actions.ts` (ubah tahap) + sinkronisasi task di `saveOrder`.
5. Halaman kalender bulan + navigasi bulan sebelumnya/berikutnya.
6. Panel hari + stepper tahap.
7. Filter cepat "Hari Ini" + badge jumlah item per tanggal.
8. Update nav & dokumentasi.

## 9. Verifikasi

- `npx prisma migrate dev` + `npx tsc --noEmit` + `npm run lint`.
- Uji manual: pesanan tanggal 3 → muncul di sel 3; ubah tanggal jadi 5 → pindah;
  hapus salah satu item → task item itu hilang, task lain tetap; ubah tahap →
  bertahan setelah refresh; pesanan `SELESAI` hilang dari kalender;
  pesanan `DIBATALKAN` juga hilang tapi datanya masih ada di DB.
- Cek WIB: pesanan dibuat pukul 00:30 WIB tetap masuk tanggal yang benar.

## 10. Di luar cakupan (fase berikut)

- Stok bahan & kapasitas harian ("maksimal 10 cheesecake per hari").
- Assign task ke staf tertentu / jam mulai produksi.
- Notifikasi WhatsApp ke pelanggan saat status berubah.
- Resep & kebutuhan bahan per varian.

## 11. Pertanyaan terbuka

1. Tahapan finalnya apa? Usulan: `Antri → Disiapkan → Diproduksi → Dikemas → Siap`.
   Kalau terlalu banyak, bisa dipangkas jadi 3: `Antri → Diproduksi → Siap`.
2. Perlu menampilkan persiapan H-1 otomatis (task muncul di kalender sehari
   sebelum tanggal ambil)?
3. Apakah "Dikemas" hanya relevan untuk layanan antar, atau semua pesanan?
4. Perlu tampilan cetak "daftar produksi hari ini" untuk dapur?
