# Plan: UX Belanja Mobile — Beranda, Detail Produk, dan Checkout

Tanggal: 2026-11-21 · Status: Batch 1–4 selesai; batasan dataset dicatat

## Tujuan

Memudahkan customer yang berbelanja lewat HP untuk menemukan produk, memahami
pilihan varian, dan menyelesaikan pesanan tanpa kehilangan konteks atau harus
bolak-balik scroll. Pertahankan estetika premium Cristin's Luscious dan alur
bisnis yang sudah berjalan.

## Perjalanan customer yang dituju

1. Masuk ke beranda dan segera paham produk apa yang dijual serta langkah
   berikutnya.
2. Menemukan produk dari katalog tanpa melewati terlalu banyak konten pengantar.
3. Membandingkan gambar, nama, harga, dan ketersediaan varian di halaman detail.
4. Menambahkan varian yang tepat ke keranjang dan mendapat konfirmasi yang jelas.
5. Mengatur tanggal ambil, memeriksa item dan total, mengisi kontak, lalu
   menerima kode pesanan.

## Kondisi saat ini

- Beranda menampilkan Hero, About, produk unggulan, katalog, lalu Footer.
  Hero punya tautan ke bagian katalog dan signature, tetapi belum mengarahkan
  customer untuk langsung memulai pemesanan online.
- Di halaman detail, galeri gambar berada sebelum deskripsi, fitur, dan daftar
  varian. Memilih varian mengubah gambar utama, tetapi gambar itu bisa jauh di
  atas ketika customer sedang membandingkan banyak varian.
- Detail produk sudah bisa menambahkan varian ke keranjang. Floating cart bar
  tersedia di halaman publik saat keranjang tidak kosong.
- Checkout sudah menangani tanggal ambil, stok ready, jumlah item, estimasi
  total, prefill kontak, dan konfirmasi kode pesanan.
- Pemesanan online saat ini adalah **pickup** dan pembayaran saat pengambilan.
  Rencana ini tidak mengubah ketentuan tersebut.

## Batch 1 — Beranda yang mengarahkan ke belanja

**Tujuan:** Customer mobile dapat melihat pilihan berikutnya tanpa membuka menu
atau membaca seluruh cerita brand.

**Area utama:** `components/Hero.tsx`, `components/Navbar.tsx`,
`components/FeaturedCheesecake.tsx`, `components/ProductList.tsx`.

**Implementasi (2026-11-21):**

- [x] Ringkas pesan Hero pada mobile dan tambahkan CTA **“Lihat Menu”** menuju
  katalog serta **“Tanya via WhatsApp”** ke nomor kontak resmi.
- [x] Ubah CTA navigasi menjadi **“Lihat Menu”** menuju katalog, bukan membuka
  keranjang kosong.
- [x] Ringkas pengantar katalog, kurangi jarak vertikal awal pada mobile, dan
  arahkan kartu produk ke detail produk sebagai langkah memilih.
- [x] Arahkan CTA cheesecake unggulan ke katalog, bukan ke form kontak.
- [x] Pertahankan gaya desktop; konten pengantar singkat berbahasa Indonesia
  diprioritaskan di layar kecil.

**Kriteria selesai:**

- [x] CTA utama Hero menuju katalog.
- [x] Customer dapat langsung menuju katalog melalui CTA tanpa melewati seluruh
  bagian cerita.
- [x] CTA beranda dan kartu katalog tidak mengarahkan customer ke keranjang
  kosong.

## Batch 2 — Memilih varian dengan konteks visual

**Tujuan:** Customer dapat membandingkan varian tanpa kehilangan hubungan
antara pilihan dan gambarnya.

**Area utama:** `components/ProductDetailClient.tsx`,
`components/FloatingCartBar.tsx`.

**Implementasi (2026-11-21):**

- [x] Letakkan pemilih varian sebelum deskripsi dan fitur, tepat setelah
  informasi utama produk.
- [x] Tampilkan strip thumbnail di galeri desktop dan thumbnail di setiap
  pilihan pada mobile; gunakan gambar produk sebagai fallback jika foto varian
  kosong.
- [x] Sinkronkan pilihan, gambar utama, harga, dan indikator stok.
- [x] Tambahkan CTA mobile yang menetap di bawah, merangkum varian dan harga
  terpilih, dengan status stok dan safe-area padding.
- [x] Atur posisi floating cart di halaman detail agar tidak bertumpuk dengan
  CTA tersebut. Galeri dan CTA desktop tetap mengikuti breakpoint desktop.

**Kriteria selesai:**

- [x] Pilihan varian ditemukan sebelum deskripsi/fitur panjang.
- [x] Setiap pilihan memiliki penanda visual, termasuk saat gambar varian
  kosong.
- [x] Gambar utama, harga, stok, dan pilihan aktif tetap konsisten.
- [x] CTA nonaktif saat stok ready hari ini habis dan keranjang tetap mengikuti
  aturan stok yang ada.

## Batch 3 — Jembatan yang jelas ke keranjang dan checkout

**Tujuan:** Setelah memilih produk, customer tahu bahwa item masuk ke keranjang
dan cara melanjutkan pesanan.

**Area utama:** `components/ProductDetailClient.tsx`,
`components/FloatingCartBar.tsx`, `components/OrderFlow.tsx`.

**Rencana:**

- Setelah tambah ke keranjang, tampilkan feedback yang jelas dan pilihan untuk
  lanjut menjelajahi produk atau membuka keranjang.
- Pertahankan floating cart bar yang sudah ada; hindari membuat indikator
  keranjang kedua dengan fungsi yang sama.
- Evaluasi checkout pada mobile dan lakukan perubahan hanya pada hambatan yang
  terlihat saat pengujian. Prioritaskan ringkasan item, tanggal ambil, total,
  dan tombol kirim pesanan tetap mudah dipahami.
- Pertahankan penyimpanan keranjang, validasi stok, prefill kontak, dan
  konfirmasi pesanan yang telah berjalan.

**Implementasi (2026-11-21):**

- [x] Tampilkan feedback setelah varian ditambahkan tanpa menggandakan CTA
  checkout; floating cart tetap menjadi jalur utama ke keranjang.
- [x] Arahkan shortcut **“Pilih Varian”** di detail ke pemilih varian, bukan
  ke checkout kosong.
- [x] Tambahkan ringkasan total dan shortcut **“Data Pemesan”** di checkout
  mobile hanya ketika form belum terlihat; shortcut disembunyikan saat sheet
  tambah produk terbuka.
- [x] Uji pada viewport 390×844: shortcut mengarah ke form, keranjang tetap
  sinkron setelah beberapa varian ditambahkan, dan tidak ada horizontal
  overflow.

**Kriteria selesai:**

- [x] Customer menerima feedback setelah item ditambahkan dan dapat membuka
  keranjang dengan jelas.
- [x] Jumlah serta isi keranjang tetap sinkron antara detail produk, floating
  bar, dan checkout.
- [x] Customer tetap melihat tanggal ambil, aturan stok, estimasi harga, dan
  ketentuan pembayaran pickup sebelum mengirim pesanan.

## Batch 4 — Verifikasi alur customer

**Verifikasi (2026-11-21):**

- [x] Alur beranda → katalog → detail Donut → checkout diuji pada 390×844;
  halaman beranda/detail juga dicek pada 320×667. CTA katalog berfungsi dan
  tidak ditemukan horizontal overflow.
- [x] Pemilihan varian banyak diuji pada produk dengan 4, 5, dan 10 varian.
  Varian aktif memperbarui nama/harga; scroll-margin menjaga opsi terakhir
  dapat diklik tanpa tertutup CTA mobile.
- [x] Ready stock tersedia diuji pada tanggal hari ini; tanggal ambil besok
  juga mengubah keterangan stok menjadi dibuat untuk tanggal terpilih.
- [x] Posisi CTA detail dan floating cart tidak bertumpuk pada 320×667 maupun
  390×844. Alur checkout menampilkan tanggal, stok, estimasi, dan ketentuan
  pickup. Tidak ada pesanan uji yang dikirim dan keranjang dibersihkan.
- [x] `npx tsc --noEmit`, ESLint untuk file UI terkait, dan `git diff --check`
  lulus.

**Batasan dataset pengujian:**

- Katalog aktif hanya menyediakan produk dengan 4, 5, atau 10 varian; produk
  satu varian tidak tersedia.
- Semua varian Ready stock yang dapat dipesan masih memiliki stok (3 atau 10),
  sehingga kondisi stok habis tidak dapat diuji.
- Gambar varian pada katalog uji semuanya jatuh ke `/placeholder-product.png`;
  fallback terverifikasi, tetapi pergantian foto varian asli tidak dapat diuji.
- Produk berlabel Pre-order pada katalog tidak menyediakan tombol tambah ke
  checkout online. Pengujian tanggal mendatang dilakukan memakai item Ready
  stock yang sudah ada di checkout.

## Batasan scope

- Tidak mengubah schema/database, autentikasi, aturan stok, atau logika
  pembuatan pesanan.
- Tidak menambahkan pengiriman/delivery ke checkout web; pemesanan online tetap
  pickup.
- Tidak menambahkan payment gateway, akun customer, atau sistem notifikasi.
- Tidak merombak checkout kecuali pengujian mobile menunjukkan hambatan yang
  nyata.

## Urutan eksekusi

Batch 1 dan Batch 2 dapat dikerjakan terpisah. Batch 3 dilakukan setelah
perubahan pada detail produk siap agar integrasi feedback keranjang dapat
diverifikasi. Batch 4 dijalankan setelah tiap batch yang mengubah UI, lalu
diulang untuk alur lengkap setelah semua batch selesai.
