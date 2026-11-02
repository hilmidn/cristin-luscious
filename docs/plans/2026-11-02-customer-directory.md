# Implementation Plan: Customer Directory & Lifetime Value (`feature/customer-directory`)

> **Goal:** Menyediakan direktori pelanggan terpusat dengan metrik Customer Lifetime Value (LTV), riwayat order, dan shortcut buat pesanan baru.

---

## 1. Arsitektur & Perubahan File

- `lib/customer-types.ts` (Baru): Tipe data `CustomerListItem`, `CustomerDetail`, filter & query params.
- `lib/customers.ts` (Baru): Server-only functions untuk query DB (`getCustomers`, `getCustomerDetail`).
- `components/admin/admin-nav.ts`: Tambah menu "Pelanggan" (`Users` icon) di sidebar.
- `app/admin/(panel)/customers/page.tsx` (Baru): Halaman utama direktori pelanggan.
- `components/admin/customers/CustomerTable.tsx` (Baru): Tabel daftar pelanggan dengan search, sort, & statistik LTV.
- `components/admin/customers/CustomerDetailDialog.tsx` (Baru): Popup modal riwayat order per pelanggan & statistik singkat.
- `app/admin/(panel)/orders/new/page.tsx`: Sinkronisasi query param `?phone=08xxx` / `?name=...` agar otomatis mengisi form pesanan baru.

---

## 2. Rincian Tugas (Step-by-Step)

### Task 1: Buat Type & Function Aggregation Customer (`lib/customers.ts`)
- Grouping data `Order` berdasarkan nomor HP yang disederhanakan (`normalizePhone`).
- Hitung total spending (hanya order status `SELESAI` / non-`DIBATALKAN`), total order count, dan order terakhir (`latestOrderAt`).
- Support search filter (nama / nomor HP) & sorting (LTV terbanyak, order terbanyak, terbaru).

### Task 2: Tambah Navigasi Sidebar (`components/admin/admin-nav.ts`)
- Tambah item `Pelanggan` di bawah grup **Penjualan** (`href: "/admin/customers"`, icon `Users`).

### Task 3: Buat Komponen Tabel & Filter Pelanggan (`components/admin/customers/`)
- Tampilkan rangkuman statistik di atas tabel: Total Pelanggan Unik, Rata-rata LTV per Pelanggan, Top Customer Bulan Ini.
- Tabel dengan kolom: Nama Pelanggan, Nomor HP, Alamat Utama, Total Order, Customer Lifetime Value (LTV), Order Terakhir, Aksi.

### Task 4: Buat Customer Detail Dialog & Shortcut Order Baru
- Modal detail menampilkan profil pelanggan + tabel riwayat semua nota order pelanggan tersebut.
- Tombol **"Buat Pesanan Baru"** mengarah ke `/admin/orders/new?phone=08xxx`, di mana form order akan otomatis terisi data nama, no. HP, dan alamat pelanggan tersebut.

---

## 3. Cara Verifikasi
- Jalankan `npx tsc --noEmit` untuk memastikan tidak ada error TypeScript.
- Cek data agregasi pelanggan muncul dengan benar sesuai data di database.
