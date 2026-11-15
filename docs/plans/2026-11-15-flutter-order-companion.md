# Plan — Flutter Android Order Companion

**Tanggal:** 2026-11-15 · **Status:** PLAN v2 (arsitektur final: lewat API)
**Tujuan:** Aplikasi Android (Flutter) untuk operasional harian Cristin Luscious:
memasukkan pesanan, mengelola produksi, dan rekap pesanan untuk print
(PDF + thermal Bluetooth).

**Keputusan Hilmi (15 Nov):**
- ~~Direct PostgreSQL~~ → **PAKAI API** (risiko kredensial di APK membuatnya
  memilih aman).
- Login **email + password** (pakai user yang sudah ada).
- Print: **PDF dan thermal Bluetooth ESC/POS** (dua-duanya).
- Deduction bahan tetap di sisi server — Flutter tidak menyentuh DB.

---

## 1. Arsitektur

```
[HP Android — Flutter]
        │  HTTPS/HTTP + Bearer token
        ▼
[REST API /api/v1/* — di dalam cristin-luscious (Next.js)]
        │  Prisma + TX_OPTIONS transactions
        ▼
[PostgreSQL]
```

- **Nol duplikasi business logic**: order code generator, transaksi order,
  production stage, deduction bahan — semua tetap di TypeScript, Flutter
  cuma konsumsi JSON + render + print.
- Port Postgres tetap tertutup; app tidak pernah tahu kredensial DB.
- Semua endpoint di guard token (lihat §2) + role admin yang sudah ada.

## 2. Auth (email + password → token)

- Schema +1 model: `ApiToken { id, userId, tokenHash(sha256), name, expiresAt, createdAt }`
  (`prisma/migrations/…_api_tokens`).
- `POST /api/v1/auth/login` — verify email+password (bcrypt, pola sama dengan
  `lib/auth.ts` authorize) → generate token acak 32-byte → simpan hash →
  balas `{ token, user: { name, email } }`.
- Middleware helper `requireApiUser(request)` di semua endpoint v1:
  baca `Authorization: Bearer …` → sha256 → lookup ApiToken (belum expired)
  → attach user. Gagal → 401.
- Logout dari app = DELETE endpoint token (atau biarkan expired).

## 3. Endpoint v1 (semua JSON, mirror server actions yang ada)

| # | Method & path | Fungsi | Reuse dari |
|---|---|---|---|
| 1 | `POST /api/v1/auth/login` | token | `lib/auth.ts` (bcrypt) |
| 2 | `GET /api/v1/catalog` | produk + varian aktif (nama, harga, satuan) | query katalog |
| 3 | `POST /api/v1/orders` | buat nota: code `CL-YYMMDD-NNN` + items + production tasks, SATU transaksi | `saveOrder` (orders/actions.ts) |
| 4 | `GET /api/v1/production?date=` | papan produksi per tanggal (task join order & item) | query produksi |
| 5 | `PATCH /api/v1/production/:taskId/stage` | maju/mundur stage; saat semua task nota SIAP → `SELESAI_PRODUKSI` **+ deduction delta** | `setProductionProductStage` + `deductIngredientsForOrder` |
| 6 | `GET /api/v1/orders/recap?from=&to=` | rekap per nota + total | query rekap |
| 7 | `GET /api/v1/orders/:code` | detail nota (untuk halaman print) | — |

Validasi input di API sama strict-nya dengan server actions
(`requireAdmin`-style guard, zod/manual check, return 422 kalau tidak valid).

## 4. App Flutter (repo baru: `hilmidn/cristin-mobile`)

```
lib/
  main.dart            — bootstrap, theme (estetika dekat Admin Atelier:
                         flat, no rounded berlebihan, Playfair-esque serif?)
  services/api.dart    — dio/http + Bearer token + refresh error handling
  screens/login.dart
  screens/home.dart    — 3 tab: Pesanan · Produksi · Rekap
  screens/order_new.dart    — katalog picker → cart → form customer → submit
  screens/production.dart   — list task per tanggal, tap untuk maju stage
  screens/recap.dart        — filter tanggal → daftar nota → print
  widgets/…
```

**Packages:** `dio` (HTTP), `flutter_secure_storage` (token), `intl` (format
Rp & tanggal), `pdf` + `printing` (PDF rekap/struk), `esc_pos_utils_plus` +
`print_bluetooth_thermal` (struk thermal 58mm), `flutter_riverpod` atau
setState sederhana (v1 cukup setState).

**Print:**
- PDF: layout A5 — header nota, item, total, tanda tangan. Share via
  `printing.sharePdf` / print dialog.
- Thermal: layout struk 32/48 kolom — logo teks, item, total; bluetooth
  picker dari pairing HP.

## 5. Materi yang harus dikumpulkan (checklist pra-koding)

- [ ] Flutter SDK stable di MacBook M1 + `flutter doctor` hijau
      (JDK 17 & Android SDK sudah ada dari workflow Rinpulse).
- [ ] **Keputusan hosting API** — di mana `cristin-luscious` jalan supaya
      bisa direach HP:
      (a) MacBook + Tailscale (HTTP aman di jaringan privat), atau
      (b) VPS/hiuhu-server + HTTPS.
- [ ] Migrasi `api_tokens` + login endpoint (commit pertama API di
      branch `feature/mobile-api`).
- [ ] Refactor ringan: tarik logika `saveOrder` & produksi ke fungsi di
      `lib/` yang bisa dipakai server actions DAN API routes (kalau
      TX_OPTIONS commit belum memisahkannya).
- [ ] `flutter create` + struktur folder (repo baru, branch `master`).
- [ ] Contoh struk thermal & PDF untuk dites ke Hilmi (SAMPLE DULU —
      dia nilai pakai mata sebelum styling final).

## 6. Out of scope v1 (nanti kalau v1 stabil)

- Edit/hapus pesanan dari mobile (tombol buka admin web saja).
- Inventori/pembelian dari mobile.
- Notifikasi push (task baru / stok rendah).
- iOS.
