# Plan: Diskon di Order (2026-11-23)

## Keputusan (Hilmi + Rin)

- Diskon **nominal Rupiah saja** (v1 tanpa persen — expand-contract kalau butuh).
- **Level nota** (satu angka per order), bukan per item.
- Bisa di-set hanya dari: **form tambah/edit pesanan web admin** dan **mobile (admin app)**.
- **Checkout publik web TIDAK punya diskon** — server memaksa 0 untuk origin WEB
  apapun yang dikirim client.
- Rekap v1 **tanpa kartu "Total Diskon"** — revenue rekap otomatis net diskon karena
  basisnya `total`.

## Aturan inti (dijaga server di `saveOrderCore`)

```
total = clamp(subtotal + shippingCost - discount, 0, ...)
```

- `0 <= discount <= subtotal + shippingCost` (total tidak boleh minus; total 0 boleh).
- `origin === "WEB"` → `discount = 0` paksa (gerbang `origin` sudah ada).
- `origin === "ADMIN"` (web admin + API mobile, keduanya auth admin) → discount dihormati.

## Perubahan per file

### cristin-luscious (web)

| File | Perubahan |
| --- | --- |
| `prisma/schema.prisma` + migration | `Order.discount Int @default(0)` (additive, aman utk kode lama) |
| `lib/order-types.ts` | `OrderInput.discount?: number`, `AdminOrder.discount: number`, `calculateOrderTotals(items, shippingCost, discount = 0)` — satu-satunya tempat matematika |
| `lib/order-save.ts` | parse + clamp discount; WEB → paksa 0; pass ke totals & insert/update |
| `app/(site)/order/actions.ts` | tidak mengirim diskon (tetap aman karena core memaksa) |
| `app/api/v1/orders` (POST/PATCH) | pass discount dari mobile (auth admin) |
| `components/admin/orders/OrderForm.tsx` | input "Diskon (Rp)" di bawah Ongkir + total live |
| `OrderTable` / detail dialog | tampil baris diskon kalau > 0 |
| `docs/plans/...` | file ini |

### cristin-mobile (app admin)

| File | Perubahan |
| --- | --- |
| `lib/data/models/order.dart` | field `discount` (fromJson default 0, toJson) |
| Form tambah/edit pesanan | input Diskon (Rp) |
| Detail pesanan | tampil diskon |

### Dokumen cetak/kirim (mobile)

`receipt_pdf.dart`, `receipt_png.dart`, `receipt_thermal.dart` — baris
`Diskon : -Rp 10.000` di antara Ongkir & TOTAL, hanya kalau > 0. Preview struk
thermal ikut otomatis (satu sumber `List<ReceiptPart>`).

## Yang TIDAK disentuh

- Stok & deduksi bahan (berbasis item, bukan nilai order).
- Rekap revenue (otomatis net diskon).
- Alur checkout publik (tanpa UI diskon).

## Urutan rollout

1. `npx prisma migrate deploy` (additive — aman sebelum kode baru).
2. Web core + UI → staging → PR → review → merge → deploy Vercel.
3. Mobile model + form → `flutter build apk --release`.

## Batch

- **Batch 1**: schema + migration + core (order-types, order-save) + API/web wiring.
- **Batch 2**: UI web admin (form, tabel, detail) + dokumen (pdf/png/thermal).
- **Batch 3**: mobile (model, form, detail) + verifikasi cross-app.
