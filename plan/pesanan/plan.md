# Plan: Modul Pesanan

Status: **sudah diimplementasi** (migration `20261031154413_orders`)
Tanggal: 2026-10-31
Prasyarat: modul Produk & Varian sudah selesai (commit `3037419`, `a38d019`).

## 1. Tujuan

Modul admin untuk mencatat pesanan yang masuk lewat WhatsApp/IG, mendukung
banyak varian dalam satu pesanan, ongkir, dan kode invoice.

## 2. Ruang lingkup

Termasuk:

- CRUD pesanan di `/admin/orders` (list, tambah, edit, hapus).
- Item pesanan berisi satu atau banyak varian (dengan jumlah).
- Data pelanggan: nama, alamat, no. HP.
- `jenisLayanan`: `PICKUP` atau `ANTAR`; saat `ANTAR` titik lokasi pengantaran wajib.
- `source` opsional, pilihannya dibangun dari nilai `source` pesanan yang sudah ada.
- Ongkir manual per pesanan (tanpa tabel tarif).
- Kode invoice otomatis (`CL-YYMMDD-NNN`), subtotal & total dihitung server.
- Halaman detail yang sekaligus menjadi tampilan invoice.

Tidak termasuk (sengaja):

- Form pemesanan publik / checkout. CTA website tetap "Order via WhatsApp".
- CRUD/master tabel Source — daftarnya diambil dari data pesanan (`DISTINCT`).
- Perhitungan ongkir otomatis dari jarak, pembayaran online, ekspor PDF.
- Stok, diskon, pajak.

## 3. Keputusan desain

| Keputusan | Alasan |
| --- | --- |
| Snapshot nama & harga di `OrderItem` | Harga/nama varian bisa berubah atau varian dihapus; invoice lama harus tetap benar. |
| `variantId` dan `productId` nullable + `onDelete: SetNull` | `saveProduct` menghapus varian yang tidak dikirim (`deleteMany`) — tanpa SetNull, edit produk akan gagal karena FK pesanan. |
| Item tanpa varian memakai `productId` | Katalog sudah mendukung produk "Custom" tanpa varian; item seperti itu tidak punya harga tetap, jadi `unitPrice` boleh diisi manual. |
| Ongkir `Int` (rupiah) | Konsisten dengan `ProductVariant.price`; hindari float. |
| Total dihitung ulang di server | Client hanya mengirim quantity/pilihan; nominal tidak boleh dipercaya dari browser. |
| `status` minimal (BARU/DIPROSES/SELESAI/DIBATALKAN) | Tanpa status, daftar pesanan hanya jadi log. 4 nilai cukup, mudah ditambah nanti. |
| Titik lokasi = teks + link map opsional | Belum ada Google Maps API/map picker; teks patokan + link maps bisa langsung dipakai kurir. Bisa dinaikkan ke lat/lng nanti tanpa mengubah UI form secara besar. |

## 4. Data model

Lihat `plan/pesanan/schema-draft.prisma` (enum `ServiceType`, `OrderStatus`, model
`Order` + `OrderItem`, dan tambahan relasi balik di `Product` / `ProductVariant`).

Poin penting:

- `Order.code` unik, dipakai sebagai nomor invoice.
- `shippingCost`, `subtotal`, `total` disimpan (bukan dihitung saat render) supaya
  invoice stabil walau harga katalog berubah.
- `OrderItem.unitPrice` nullable: null = "by request" (harga menyusul).
- Migration: `npx prisma migrate dev --name orders` → `prisma/migrations/<ts>_orders/`.

## 5. Aturan validasi (server, `actions.ts`)

Pesanan:

1. `customerName` wajib, ≤ 120 karakter.
2. `phone` wajib; normalisasi ke digit (`+62`/`0` diterima), 9–15 digit.
3. `address` wajib, ≤ 500 karakter.
4. `serviceType` harus `PICKUP` atau `ANTAR`.
5. `ANTAR` → `deliveryPoint` wajib (min 5 karakter). `PICKUP` → titik lokasi & ongkir
   dibersihkan (null / 0).
6. `deliveryMapUrl` opsional; kalau diisi harus URL `http(s)`.
7. `source` opsional, trim, ≤ 60 karakter; string kosong → null.
8. `shippingCost` bilangan bulat ≥ 0.
9. `items` minimal 1 baris.

Item:

1. `quantity` bilangan bulat ≥ 1 (batas atas wajar, mis. 999).
2. `variantId` diisi → server ambil `unitPrice`, `priceUnit`, `productName`,
   `variantName` dari DB (bukan dari client). Varian harus ada; kalau unpublish tetap
   boleh (pesanan historis), tapi picker hanya menawarkan yang published.
3. `variantId` kosong tapi `productId` diisi → nama diambil dari produk, `unitPrice`
   dari input (opsional, ≥ 0).
4. Kalau keduanya kosong → tolak.
5. `lineTotal = (unitPrice ?? 0) * quantity`; `subtotal = Σ lineTotal`;
   `total = subtotal + shippingCost`. Dihitung di server.

Kode invoice: `CL-` + `YYMMDD` + `-` + urutan 3 digit per hari. Urutan dihitung dari
jumlah pesanan hari itu di dalam transaksi; kalau `code` bentrok (`P2002`), naikkan
urutan dan ulangi (maks 5 percobaan).

## 6. File yang disentuh / dibuat

Baru:

- `lib/order-types.ts` — tipe + helper murni (aman untuk client):
  `ServiceType`, `OrderStatus`, `SERVICE_LABELS`, `ORDER_STATUS_LABELS`,
  `formatRupiah()`, `calculateOrderTotals()`, `normalizePhone()`, `isValidPhone()`.
- `lib/orders.ts` — server-only (`import "server-only"`), pola seperti `lib/catalog.ts`:
  `getAdminOrders({ status, source, q, page })`,
  `getAdminOrderById(id)`, `getOrderSources()` (groupBy source, urut jumlah desc),
  `getOrderStats()`, `getOrderableCatalog()` (produk/varian published untuk picker),
  `createOrderCode(tx)`.
- `app/admin/(panel)/orders/actions.ts` — `saveOrder`, `deleteOrder`, `setOrderStatus`
  (pola `requireAdmin()` + `revalidatePath` dari `products/actions.ts`).
- `app/admin/(panel)/orders/page.tsx` — daftar + filter status/source + pencarian
  kode/nama/HP (`searchParams`), stat ringkas (total, baru, omzet bulan ini).
- `app/admin/(panel)/orders/new/page.tsx` — form pesanan baru.
- `app/admin/(panel)/orders/[id]/page.tsx` — edit + panel invoice (kode, tanggal,
  item, subtotal, ongkir, total) dan tombol hapus.
- `components/admin/orders/OrderForm.tsx` — client form: data pelanggan, pilihan
  layanan (titik lokasi aktif hanya saat ANTAR), `<datalist>` untuk source,
  baris item (pilih produk/varian, qty, hapus/tambah), preview subtotal–ongkir–total,
  input ongkir.
- `components/admin/orders/DeleteOrderButton.tsx` — pola `DeleteProductButton`.
- `components/admin/orders/OrderStatusControl.tsx` — ubah status dari daftar/detail.
- `components/admin/order-overview-table.tsx` (opsional, bila dashboard diisi data pesanan).

Diubah:

- `prisma/schema.prisma` — enum + model dari draft.
- `components/admin/admin-nav.ts` — hapus `soon: true` pada "Pesanan".
- `app/admin/(panel)/page.tsx` — teks "Modul Pesanan ... menyusul" diperbarui;
  tambah kartu statistik pesanan baru (opsional).
- `AGENTS.md` — tambah ringkas konvensi modul Pesanan (snapshot item, code generation,
  source tanpa tabel master).

## 7. Alur UI

1. `/admin/orders` → tabel: kode, tanggal, pelanggan, layanan, item (n varian),
   total, source, status, aksi. Filter: status, source (dari `getOrderSources()`),
   pencarian. Kosong → empty state seperti halaman produk.
2. `/admin/orders/new` → form. Default `PICKUP`, ongkir 0 & disabled. Tambah item →
   dropdown produk → dropdown varian (produk tanpa varian hanya muncul sebagai
   satu entri). Preview total berubah saat qty/ongkir berubah.
3. Simpan → redirect ke `/admin/orders` (pola `ProductForm`).
4. `/admin/orders/[id]` → sama seperti form + blok invoice di sisi kanan
   (`invoice`-style: CL-..., pelanggan, alamat/lokasi, daftar item, subtotal,
   ongkir, total). Tombol status + hapus.
5. `source` diketik bebas; saran muncul dari pesanan sebelumnya, dan begitu ada
   pesanan dengan source baru, ia otomatis masuk daftar (`getOrderSources()`).

## 8. Urutan implementasi

1. Schema + migration (`prisma migrate dev --name orders`), lalu `prisma generate`.
2. `lib/order-types.ts` + `lib/orders.ts`.
3. `actions.ts` (validasi, hitung total, kode invoice, revalidate `/admin/orders`).
4. Halaman list + nav.
5. Form new/edit + komponen item.
6. Halaman detail + invoice.
7. Poles dashboard (teks + stat) dan `AGENTS.md`.

## 9. Verifikasi

- `npx prisma format` dan `npx prisma validate`.
- `npx tsc --noEmit`.
- `npm run lint` (file yang disentuh).
- Uji manual bila DB tersedia: tambah pesanan ANTAR tanpa titik lokasi → ditolak;
  PICKUP dengan ongkir > 0 → ongkir jadi 0; dua pesanan di hari yang sama →
  kode berurutan; edit produk (hapus varian yang dipakai pesanan) → tidak error FK;
  source baru muncul di datalist pesanan berikutnya.
- `npm run build` sekali di akhir.

## 10. Risiko / catatan

- **FK varian**: tanpa `onDelete: SetNull` pada `OrderItem.variantId`, alur
  `saveProduct` (deleteMany varian) akan gagal setelah ada pesanan.
- **Kode invoice** berbasis hitungan harian bisa bentrok saat dua admin menyimpan
  bersamaan; ditangani retry `P2002`.
- **Zona waktu**: pengurutan "hari ini" memakai waktu server; bila perlu WIB eksplisit,
  hitung awal hari dengan offset `+07:00`.
- Pesanan dengan item harga null membuat subtotal lebih kecil dari nilai sebenarnya —
  tampilkan penanda "harga menyusul" di invoice.
