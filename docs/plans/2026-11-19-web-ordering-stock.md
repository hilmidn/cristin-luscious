# Plan: Order dari Web + Stok Varian (Fulfillment Mode)

Tanggal: 2026-11-19 · Branch: `feature/web-ordering-stock`

## Keputusan desain (terkonfirmasi dengan Hilmi, 19 Nov)

1. **Order dari web = publik, tanpa akun.** Isi form hanya **nama + nomor HP**. **PICKUP only** (tidak ada ANTAR di web). Pembayaran **manual** (tanpa payment gateway) — dibayar saat ambil.
2. **`fulfillmentMode` di level PRODUCT** (bukan varian): `PRE_ORDER` (default, perilaku sekarang) | `READY`.
3. **Stok jadi = ledger movement** (`VariantStockMovement`) + cached `stockQty` di varian. Restock manual dari admin; pengurangan **otomatis** saat order.
4. **Item READY ambil hari ini = skip kalender produksi** (tanpa `ProductionTask`), order langsung `SELESAI_PRODUKSI`, deduct bahan tetap jalan di transaksi yang sama.

## Aturan stok (inti logika)

- **Item produk READY dengan `scheduledAt` = hari ini (WIB) → diambil dari stok jadi**: tanpa task produksi, stok varian berkurang, bahan ke-deduct langsung (delta/idempoten via `deductIngredientsForOrder`).
- **Tanggal selain hari ini → jalur pre-order normal** (masuk kalender, deduct saat semua task SIAP). Berlaku juga untuk produk READY — stok hari ini hanya untuk pengambilan hari ini.
- **Satu order satu tanggal** → order campur (READY + PRE_ORDER) otomatis jadi pre-order penuh mengikuti tanggal pre-order; UI web memberi tahu hal ini.
- **Batal / hapus order → stok dikembalikan** (movement IN "Pembatalan"), kecuali status sebelumnya sudah `SELESAI`.
- **Edit order** → delta stok per item (qty naik = OUT delta, turun = IN delta).
- **Atomic guard**: pengurangan stok via `updateMany({ where: { id, stockQty: { gte: qty } }, data: { stockQty: { decrement } } })` — count 0 = gagal "Stok tidak cukup". Tidak ada oversell.
- **Alamat wajib hanya untuk ANTAR**; PICKUP boleh kosong (dipakai web order). Perubahan di `saveOrderCore`.
- Order web: `source: "Website"`, `serviceType: PICKUP`, `scheduledAt` = hari ini (READY) atau pilihan customer ≥ besok (PRE_ORDER).

## Model data (migration)

- `enum FulfillmentMode { PRE_ORDER READY }`
- `Product.fulfillmentMode FulfillmentMode @default(PRE_ORDER)`
- `ProductVariant.stockQty Int @default(0)` (cached; ledger = source of truth riwayat)
- `model VariantStockMovement { id, variantId (FK Cascade), type (enum VariantStockMovementType { IN OUT ADJUST }), qty Int (selalu positif), note String?, orderItemId String? (index), createdAt }`

## Tasks

### 1. Schema + migration
- Edit `prisma/schema.prisma` (enum, field, model di atas).
- Migration: `npx prisma migrate diff --from-schema <old> --to-schema <new> --script` → `prisma/migrations/<ts>_web_ordering_stock/migration.sql` (VPS tanpa DB). Verifikasi nama constraint camelCase.
- `npx prisma format && npx prisma generate`, lalu `npx tsc --noEmit`.

### 2. `lib/stock.ts` + `lib/stock-types.ts`
- `lib/stock-types.ts` (client-safe): tipe `StockRow`, `StockMovementRow`, konstanta label.
- `lib/stock.ts` (server-only):
  - `recordStockMovement(tx, { variantId, type, qty, note?, orderItemId? })` — satu pintu, update `stockQty` atomik (IN/ADJUST naik, OUT turun; OUT wajib cukup stok).
  - `getStockOverview()` — daftar varian (produk READY & PRE_ORDER) + stok terkini.
  - `restockVariant(id, qty, note)`, `adjustVariantStock(id, qtyBaru, note)` (ADJUST = selisih).
  - `getVariantMovements(variantId, limit)`.

### 3. Integrasi `lib/order-save.ts` (`saveOrderCore`)
- Validasi: `address` wajib hanya `ANTAR`.
- Setelah resolve items: tentukan item stok (produk READY + scheduledAt == jakartaStartOfDay(hari ini)).
- Item stok **dikeluarkan** dari `productionTask.createMany` (step 4) — item kalender tetap dapat task.
- Jika ada item stok: panggil `recordStockMovement(OUT)` per item **dalam transaksi yang sama** (guard stok cukup).
- Jika order baru **semua** itemnya stok → status = `SELESAI_PRODUKSI` + `deductIngredientsForOrder(tx, id)` di transaksi yang sama.
- Edit order: delta stok per item; item stok yang dihapus → IN pengembalian.
- `deleteOrder` & `setOrderStatus(DIBATALKAN)` di `app/admin/(panel)/orders/actions.ts`: restore stok (movement IN) jika belum pernah `SELESAI`.

### 4. Admin: halaman stok
- `app/admin/(panel)/stock/page.tsx` + `components/admin/stock/StockClient.tsx` + `actions.ts` (`restock`, `adjust`, `getMovements`).
- Tabel: produk / varian / stok (mono) / aksi popover (Restock, Koreksi, Riwayat). Riwayat = dialog list movement (tanggal WIB, tipe, qty, note, kode order).
- Nav: tambah item **"Stok"** di `components/admin/admin-nav.ts` (re-read file dulu — konvensi nav).

### 5. Admin: form produk & form order
- `components/admin/products/ProductForm.tsx`: select `fulfillmentMode` (Pre-order / Ready stock), persist via `saveProduct`.
- `components/admin/orders/OrderForm.tsx`: item READY + tanggal hari ini → badge kecil "dari stok" (informatif saja, logika tetap di `saveOrderCore`).

### 6. Halaman publik `/order`
- `app/(site)/order/page.tsx` (server, `dynamic = "force-dynamic"`, load katalog + stok) + `components/OrderFlow.tsx` (client) + `app/(site)/order/actions.ts` (`"use server"`, panggil `saveOrderCore`, tanpa `requireAdmin`).
- Flow satu halaman: pilih produk/varian (READY tampil "Sisa N hari ini", habis = disable; PRE_ORDER tampil "Pre-order") → keranjang → form nama + HP (+ catatan opsional) → submit.
- Cart campur → info "diambil bersamaan dengan tanggal pre-order".
- Sukses → tampil kode invoice `CL-…` + ringkasan + tanggal ambil. Gaya mengikuti tema site (bukan atelier admin).
- Tidak ada keranjang tersimpan / login / gateway.

### 7. Katalog publik (kecil)
- `components/ProductList.tsx` + `components/ProductDetailClient.tsx`: badge "Ready · sisa N" / "Pre-order" + link ke `/order`.

### 8. Verifikasi & deploy
- `npx tsc --noEmit` + eslint file tersentuh (VPS).
- Diff migration vs schema ganda-ceknama constraint.
- Deploy migration (`prisma migrate deploy`) dari env yang punya `DATABASE_URL` (Mac/production) — **koordinasi dengan Hilmi**.
- Test manual di production: order web READY (stok berkurang, tanpa task, bahan ke-deduct), pre-order (masuk kalender), batal (stok kembali).

## Di luar scope v1
- ANTAR dari web, payment gateway (Midtrans), notifikasi otomatis (Telegram/WA), kuota pre-order per tanggal, minimal lead time per produk, multi-stok hari lain.
