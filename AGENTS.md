<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Konteks Proyek

Website Cristin Luscious (cookies & dessert premium) + area admin privat di `/admin`.

- Next.js 16 (App Router), React 19, Tailwind CSS 4
- NextAuth v4 (Credentials, JWT session, `lib/auth.ts`)
- Prisma 7 + PostgreSQL (Neon) dengan driver adapter `@prisma/adapter-pg`
- UploadThing untuk upload gambar produk
- Bahasa komentar/UI: Indonesia

## Riwayat penting (commit)

- `cfdf4b5` — Integrasi Prisma: `prisma.config.ts`, migration `admin_users`, seed admin, `lib/prisma.ts`, `lib/auth.ts`, `proxy.ts`, `types/next-auth.d.ts`.
- `3037419` — Katalog produk: model `Product` / `ProductVariant`, migration `20261031010000_catalog`, `lib/catalog.ts` + `lib/catalog-types.ts`, `prisma/seed-data.ts`, CRUD admin (`app/admin/(panel)/products/actions.ts`), UploadThing (`app/api/uploadthing/core.ts`).
- `a38d019` — Placeholder gambar: `productImageSrc()` + `PRODUCT_IMAGE_PLACEHOLDER`.

## Konvensi Prisma (jangan diubah tanpa alasan kuat)

- Client di-generate ke `generated/prisma` dan **gitignored**; jalankan `prisma generate` lewat `postinstall`/`npm run build`.
- Selalu akses DB lewat `getPrisma()` dari `lib/prisma.ts` (lazy). Jangan instansiasi `PrismaClient` di tempat lain — import top-level bikin `next build` gagal saat `DATABASE_URL` tidak ada.
- `next.config.ts` memuat `serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"]`.
- `prisma.config.ts` memuat `.env.local` eksplisit (Prisma CLI tidak membacanya sendiri) dan memakai `DIRECT_URL ?? DATABASE_URL`.
- Env: `DATABASE_URL` = koneksi Neon pooled (runtime), `DIRECT_URL` = direct (migration). Lihat `.env.example`.
- Migration ada di `prisma/migrations` (jangan `db push` untuk perubahan yang mau di-commit). Seed: `tsx prisma/seed.ts`; katalog hanya di-seed bila kosong kecuali `SEED_CATALOG_FORCE=1`.

## Konvensi katalog & gambar

- `lib/catalog.ts` pakai `import "server-only"` — jangan diimpor dari client component.
- `lib/catalog-types.ts` harus bebas import server-only karena dipakai form/detail di client (types + `formatPrice`, `slugify`, `parseTags`, `isAllowedImagePath`).
- Path gambar hanya boleh `/...` (public) atau host UploadThing (`*.ufs.sh`, `utfs.io`, sudah di-allowlist di `next.config.ts`). Render selalu lewat `productImageSrc()` supaya jatuh ke `/placeholder-product.png`.
- UploadThing router `productImage` mensyaratkan sesi NextAuth; hook client ada di `lib/uploadthing.ts`.

## Konvensi pesanan (`/admin/orders`)

- `Order` menyimpan `code` invoice `CL-YYMMDD-NNN` (urutan per hari, retry saat `P2002`), pelanggan, alamat, `serviceType` (`PICKUP`/`ANTAR`), `deliveryPoint` (wajib saat ANTAR), ongkir manual, subtotal, total, dan `status`.
- `OrderItem` menyimpan **snapshot** `productName`/`variantName`/`unitPrice`; relasi `variantId`/`productId` nullable dengan `onDelete: SetNull` supaya `saveProduct` tetap bisa menghapus varian yang sudah dipesan.
- Harga item bervarian selalu diambil dari DB di server; client hanya mengirim pilihan + quantity. Item produk tanpa varian (custom) boleh pakai harga manual.
- `source` **tanpa tabel master**: `getOrderSources()` memakai `groupBy` dari data pesanan dan dipakai sebagai `<datalist>` + filter.
- Daftar pesanan dipisah dua halaman: `/admin/orders` hanya status aktif (`BARU`, `DIPROSES`), sedangkan `/admin/orders/recap` menampung `SELESAI` dan `DIBATALKAN`. Filter status per halaman dibatasi ke status yang relevan lewat `getAdminOrders({ statuses })`.
- Tabel dan filter dipakai bersama oleh kedua halaman: `components/admin/orders/OrderTable.tsx` + `OrderFilters.tsx`. Detail dibuka sebagai popup (`OrderDetailDialog.tsx`, data lengkap sudah ikut di query list); edit tetap halaman `/admin/orders/[id]`.
- Helper murni (label, `formatRupiah`, `calculateOrderTotals`, `normalizePhone`) ada di `lib/order-types.ts`; query server-only di `lib/orders.ts`. Form ada di `components/admin/orders/OrderForm.tsx`.
- **Zona waktu: selalu WIB (`Asia/Jakarta`)**, bukan zona server. Format tampilan, prefix kode invoice harian, batas "hari ini", dan rentang bulan statistik memakai `jakartaDateKey()` / `jakartaStartOfDay()` / `jakartaStartOfMonth()` / `jakartaMonthRange()` dari `lib/order-types.ts`.
- Statistik uang di `/admin/orders/recap`: `monthRevenue` hanya order `SELESAI`, `monthCancelled` hanya `DIBATALKAN`, keduanya memakai **tanggal ambil/kirim (`scheduledAt`)** dengan fallback `createdAt` bila jadwal kosong. Jangan hitung pendapatan dari `createdAt` saja.
- Halaman Rekap Pesanan memfilter **per bulan** lewat `searchParams.month` (`YYYY-MM`, nilai `all` = semua bulan, tanpa parameter = bulan berjalan). Filter yang sama dipakai untuk daftar (`getAdminOrders({ month })`) dan kartu angka (`getRecapStats(monthKey)`); pilihan bulan diambil dari `getClosedOrderMonths()` (selalu ditambah bulan berjalan).
- `/admin` (dashboard) adalah ringkasan **pesanan**, bukan katalog: kartu statistik (`getOrderStats` + `getRecapStats` bulan berjalan), grafik 6 bulan `getOrderTrend()` (`OrderTrendChart`), dan 5 pesanan aktif terbaru. Grafik dibuat dari `div` + tinggi persentase, tanpa library chart tambahan.
- `Order.scheduledAt` adalah tanggal ambil/kirim (`DATE`, tanpa jam) dan wajib diisi di form; nullable di DB hanya untuk kompatibilitas data lama.
- Setiap `OrderItem` otomatis mendapat satu `ProductionTask` (lihat bagian Konvensi produksi) di transaksi yang sama.

## Konvensi produksi (`/admin/production`)

- Unit kerja = **item pesanan**, bukan pesanan. `ProductionTask` punya `orderItemId @unique`; satu task per `OrderItem`.
- `scheduledAt` pada task **disalin** dari `Order.scheduledAt` (tanggal ambil/kirim) dan disinkronkan di dalam transaksi `saveOrder`. Jangan bikin field tanggal baru di form produksi.
- Kalender hanya menampilkan pesanan aktif (`BARU`, `DIPROSES`). `SELESAI`/`DIBATALKAN` otomatis hilang dari kalender tanpa menghapus task (riwayat tetap ada).
- Tahap: `ANTRI → DISIAPKAN → DIPRODUKSI → DIKEMAS → SIAP`. Ubah tahap hanya lewat `moveProductionStage` / `setProductionStage` di `app/admin/(panel)/production/actions.ts`; `startedAt` diisi saat keluar dari ANTRI, `completedAt` saat SIAP.
- **Item pesanan tidak boleh dihapus-recreate** saat edit: `saveOrder` mencocokkan item lama lewat `variantId`/`productId` (fallback `productName::variantName`) agar task & progres tahap tidak hilang. Menghapus item dari form akan menghapus task lewat `onDelete: Cascade`.
- Tipe & helper tanggal/slot kalender ada di `lib/production-types.ts` (client-safe), query `server-only` di `lib/production.ts`. Semua perhitungan tanggal memakai WIB.
- Halaman: `app/admin/(panel)/production/page.tsx` dengan `searchParams` `month=YYYY-MM` dan `date=YYYY-MM-DD`; grid di `ProductionCalendar`, panel hari + stepper di `components/admin/production/`.

## Auth & routing

- Proteksi admin lewat `proxy.ts` (pengganti `middleware.ts` di Next 16), matcher `/admin/:path*`. Logika redirect di-handle manual di dalam fungsi, `callbacks.authorized: () => true`.
- `/admin/login` publik; user yang sudah login diarahkan ke `/admin`.

## Perintah

`npm run dev` · `npm run build` (prisma generate + next build) · `npm run lint` · `npm run db:migrate` / `db:deploy` · `npm run db:seed` · `npm run db:studio`

## Catatan

- Belum ada test otomatis. Verifikasi minimal: `npx tsc --noEmit`, lalu `npm run lint` untuk file yang disentuh.
- `README.md` berisi setup admin + deploy Vercel/Neon.
