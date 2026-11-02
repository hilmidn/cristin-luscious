# Implementation Plan: Laporan Produk Terlaris & Analytics (`feature/sales-reports`)

> **Goal:** Menyediakan halaman analitik penjualan produk (best seller, kontribusi omzet per varian, tren kuantitas terjual) untuk analisis stok & menu.

---

## 1. Arsitektur & Perubahan File

- `lib/report-types.ts` (Baru): Tipe data `ProductSalesSummary`, `VariantSalesSummary`, `SalesReportFilter`.
- `lib/reports.ts` (Baru): Query server-only aggregation dari `OrderItem` & `Order` (status `SELESAI`).
- `components/admin/admin-nav.ts`: Tambah menu "Laporan Penjualan" (`BarChart3` icon) di bawah **Penjualan**.
- `app/admin/(panel)/reports/products/page.tsx` (Baru): Halaman laporan penjualan produk terlaris.
- `components/admin/reports/ProductSalesChart.tsx` (Baru): Visualisasi horizontal bar chart Qty / Omzet terjual per produk (native CSS/flexbox, zero heavy dependencies).
- `components/admin/reports/VariantSalesTable.tsx` (Baru): Tabel breakdown per varian (Qty terjual, total omzet, % kontribusi omzet total).

---

## 2. Rincian Tugas (Step-by-Step)

### Task 1: Buat Function Agregasi Penjualan Produk (`lib/reports.ts`)
- Query `OrderItem` yang terikat pada `Order` dengan status `SELESAI`.
- Filter rentang waktu: per bulan (`month=YYYY-MM`), rentang kustom (`startDate` & `endDate`), atau `all`.
- Hitung total Qty terjual, total omzet (lineTotal), persentase kontribusi terhadap total omzet toko.
- Grouping per `Product` dan per `ProductVariant`.

### Task 2: Tambah Navigasi Sidebar (`components/admin/admin-nav.ts`)
- Tambah item `Laporan Produk` di bawah grup **Penjualan** (`href: "/admin/reports/products"`, icon `BarChart3`).

### Task 3: Komponen Stat Card & Top Ranking (`components/admin/reports/`)
- 4 Stat Cards di bagian atas:
  1. **Best Seller (Qty)**: Nama produk & varian paling banyak dipesan.
  2. **Top Revenue**: Produk penyumbang omzet terbesar.
  3. **Total Items Terjual**: Sum total kuantitas produk yang sudah selesai.
  4. **Rata-rata Pcs per Order**: Qty per nota.

### Task 4: Komponen Bar Chart Horizontal & Tabel Detail Breakdown
- Horizontal bar chart visualisasi ranking top 5-10 produk (menggunakan persentase flexbox/CSS).
- Tabel breakdown lengkap per varian dengan fitur pencarian & sorting per Qty / Omzet.
- Opsi Export data ke CSV (download file `.csv` dari data client).

---

## 3. Cara Verifikasi
- Jalankan `npx tsc --noEmit` untuk memastikan tipe data & query kompatibel.
- Pastikan hanya pesanan status `SELESAI` yang dihitung dalam omzet & Qty terjual (konsisten dengan halaman Rekap Pesanan).
