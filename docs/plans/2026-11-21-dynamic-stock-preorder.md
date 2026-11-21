# Plan: Stok Dinamis dan Pre-order Otomatis

Tanggal: 2026-11-21 · Status: Rencana disepakati; implementasi belum dimulai

## Tujuan

Menghapus pilihan cara pemenuhan statis `READY` / `PRE_ORDER` pada produk.
Ketersediaan ditentukan oleh stok setiap varian saat customer memesan:

- Stok cukup dan customer memilih ambil hari ini: penuhi dari stok jadi.
- Stok tidak cukup, atau customer memilih jalur pre-order: buat semua item
  dalam nota melalui produksi sesuai tanggal yang dipilih.
- Varian tanpa stok tetap dapat dimasukkan ke keranjang dan dipesan sebagai
  pre-order.

Plan ini menggantikan keputusan fulfillment statis pada
[plan Order Web + Stok Varian](./2026-11-19-web-ordering-stock.md). Pickup-only,
pembayaran saat pengambilan, ledger stok, dan fitur lain di luar mode produk
tetap mengikuti perilaku yang sudah ada.

## Keputusan yang sudah dikonfirmasi

1. `Product.fulfillmentMode` dihapus. Status ketersediaan dihitung dinamis per
   varian berdasarkan stok.
2. `Product.orderable` tetap ada. Status ini berbeda dari stok: produk yang
   tidak boleh dipesan online masih dapat disembunyikan dari checkout.
3. Checkout web menyediakan dua jalur:
   - **Ambil hari ini** hanya jika stok mencukupi seluruh keranjang.
   - **Pre-order** dengan tanggal paling cepat H+3 menurut kalender WIB.
     Besok (H+1) dan lusa (H+2) tidak tersedia.
4. Jika satu varian atau jumlah item saja tidak tercukupi, seluruh nota menjadi
   pre-order. Tidak ada pemenuhan campuran maupun pemecahan jumlah sebagian
   stok/sebagian produksi.
5. Memilih pre-order berarti semua item dibuat untuk tanggal tersebut dan stok
   jadi yang tersedia tidak direservasi, meskipun jumlahnya sebenarnya cukup.
6. Batas H+3 hanya berlaku untuk checkout web. Admin dapat mengatur tanggal
   pengecualian; jika stok tidak cukup, pesanan admin tetap dicatat sebagai
   pre-order pada tanggal yang dipilih, tanpa mengurangi stok yang tidak ada.
7. Semua evaluasi tanggal menggunakan zona waktu `Asia/Jakarta`.

## Aturan target

| Kondisi keranjang | Pilihan checkout | Hasil |
| --- | --- | --- |
| Semua jumlah item tersedia di stok | Ambil hari ini | Kurangi stok secara atomik; item tidak masuk kalender produksi |
| Semua jumlah item tersedia di stok | Pre-order, H+3 atau lebih | Semua item masuk produksi; stok jadi tidak direservasi |
| Ada satu jumlah item yang melebihi stok | Pre-order, H+3 atau lebih | Seluruh nota masuk produksi; stok jadi tidak dikurangi |
| Ada kekurangan stok | Ambil hari ini | Tidak dapat dipilih; web mengarahkan customer ke jalur pre-order |
| Tanggal H+1 atau H+2 | Checkout web | Tidak dapat dipilih dan tetap ditolak oleh validasi server |

Jika stok berubah setelah halaman checkout dibuka, validasi server menjadi
otoritas. Order ambil hari ini yang tidak lagi memiliki stok cukup harus gagal
dengan pesan yang jelas; sistem tidak boleh oversell atau diam-diam mengubah
tanggal pesanan.

## Dampak model dan alur saat ini

- `Product.fulfillmentMode` dan enum `FulfillmentMode` ada di Prisma. Mode ini
  dipakai untuk klasifikasi pesanan, katalog, form produk, halaman stok, dan
  response API stok.
- `saveOrderCore` saat ini menggabungkan mode produk dengan tanggal untuk
  memutuskan potong stok atau membuat `ProductionTask`.
- Katalog/detail dan `OrderFlow` saat ini mengunci pilihan atau jumlah
  berdasarkan mode produk.
- Riwayat pemenuhan lama belum disimpan langsung pada `OrderItem`; sebagian
  dapat diketahui dari `ProductionTask` dan `VariantStockMovement`.

Sebelum implementasi, audit data lama untuk memastikan setiap item dapat
diklasifikasikan dengan aman. Rekomendasi model baru adalah menyimpan snapshot
internal di `OrderItem`, misalnya `fulfillmentType = STOCK | PRE_ORDER`. Ini
bukan mode produk: nilainya mencatat bagaimana item tertentu benar-benar
dipenuhi saat nota dibuat dan menjaga edit, pembatalan, serta riwayat tetap
konsisten.

Untuk backfill, `ProductionTask` dapat menandai item pre-order dan movement
stok yang tertaut ke `orderItemId` dapat menandai item stok. Baris yang tidak
memiliki bukti yang cukup harus dihitung dan ditinjau sebelum migrasi; jangan
memberi klasifikasi historis secara diam-diam.

## Rencana batch

### Batch 1 — Audit data dan migrasi model

- Audit jumlah `OrderItem` lama yang memiliki task produksi, movement stok,
  keduanya, atau tidak satu pun.
- Pastikan relasi historis, pesanan batal/selesai, dan item yang sudah tidak
  memiliki varian tetap terwakili oleh snapshot nama/harga.
- Tambahkan `OrderItem.fulfillmentType` dan backfill dari task/movement yang
  tersedia.
- Gunakan pendekatan **expand-contract**: pertahankan kolom produk lama selama
  kode baru belum sepenuhnya menggunakannya; hapus `Product.fulfillmentMode`
  dan enum hanya setelah consumer lama tidak lagi membacanya.
- Pertahankan `ProductVariant.stockQty` dan ledger `VariantStockMovement`.

### Batch 2 — Logika pesanan, stok, dan produksi

- Buat satu aturan server untuk menentukan apakah nota memakai stok atau
  pre-order berdasarkan tanggal, jumlah seluruh item, dan stok aktual.
- Jalur stok hari ini mengurangi stok dalam transaksi yang sama dengan
  penyimpanan order. Gunakan guard atomik yang sudah ada agar dua checkout
  bersamaan tidak mengambil stok terakhir yang sama.
- Jalur pre-order membuat task untuk seluruh item; stok jadi tidak dipotong dan
  bahan tetap mengikuti alur produksi yang ada.
- Validasi H+3 dilakukan untuk submit web, tidak hanya pada input tanggal di
  browser. Jalur admin boleh membuat pengecualian tanggal.
- Pertahankan konsistensi saat order diedit, item/quantity berubah, order
  dibatalkan atau dihapus, dan progres produksi sudah berjalan.
- Perubahan klasifikasi saat edit harus memperbarui task serta movement stok
  tanpa menghapus progres produksi yang masih berlaku.

### Batch 3 — Katalog, checkout, admin, dan API

- Hapus dropdown cara pemenuhan dari form produk.
- Di katalog/detail, tampilkan ketersediaan per varian berdasarkan stok:
  varian tersedia untuk hari ini atau dapat dipesan sebagai pre-order.
- Varian stok nol tetap dapat ditambahkan ke keranjang. Jumlah cart tidak boleh
  terkunci pada stok saat ini jika customer dapat memilih jalur pre-order.
- Buat pilihan **Ambil hari ini** / **Pre-order** pada checkout. Input tanggal
  pre-order memakai `min = H+3` WIB. Pemilihan hari ini dinonaktifkan bila
  seluruh keranjang tidak dapat dipenuhi dari stok.
- Sesuaikan ringkasan stok admin agar stok nol berarti perlu pre-order, bukan
  produk tidak dapat dipesan.
- Audit consumer `GET /api/v1/stock` sebelum mengubah response yang saat ini
  memuat `fulfillmentMode`; koordinasikan perubahan dengan aplikasi mobile
  pemakai API agar tidak menjadi breaking change tanpa rencana.

### Batch 4 — Verifikasi dan rollout

- Uji aturan tanggal pada WIB: hari ini, H+1, H+2, H+3, pergantian hari, serta
  manipulasi request di luar browser.
- Uji stok cukup, nol, kekurangan sebagian, quantity melebihi stok, cart
  campuran, perubahan stok bersamaan, dan kegagalan stok saat submit.
- Uji alur edit, batal, hapus, restock, dan transisi status/task produksi untuk
  pesanan lama dan baru.
- Uji katalog, detail produk, checkout, form produk, halaman stok, dan API
  mobile pada ukuran layar yang relevan.
- Jalankan migration Prisma yang di-commit melalui alur migrasi proyek; jangan
  memakai `db push` untuk perubahan ini. Koordinasikan migrasi production dan
  deploy aplikasi agar versi lama tidak membaca kolom yang sudah dihapus.

## Kriteria selesai

- Tidak ada lagi `Product.fulfillmentMode` pada schema, UI, query, seed, atau
  kontrak API yang sudah dimigrasikan.
- Produk online yang `orderable` tetap dapat dipesan ketika stok variannya nol
  melalui pre-order.
- Hari ini hanya dapat dipilih jika seluruh nota dapat dipenuhi dari stok;
  H+1/H+2 tidak tersedia; pre-order paling cepat H+3 WIB.
- Seluruh nota yang kurang stok atau memilih pre-order diproduksi bersama pada
  satu tanggal; tidak ada stok yang direservasi untuk jalur tersebut.
- Movement stok, snapshot item, task produksi, status order, pembatalan, dan
  edit historis tetap konsisten tanpa oversell.
- Consumer API stok yang terdampak telah diidentifikasi dan diperbarui atau
  dilindungi dengan rollout kompatibel.

## Di luar scope

- Mengubah aturan pickup/pengiriman web atau menambah payment gateway.
- Membagi satu nota ke beberapa tanggal ambil atau mencampur stok jadi dengan
  produksi dalam satu nota.
- Reservasi stok untuk pesanan di tanggal mendatang.
- Mengubah sistem stok bahan, resep, atau pencatatan produksi selain integrasi
  yang diperlukan untuk fulfillment baru.
