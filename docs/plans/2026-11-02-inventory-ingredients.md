# Implementation Plan: Pembelian Bahan Baku, Resep & Tracking Stok (`feature/inventory-ingredients`)

> **Goal:** Admin bisa mencatat pembelian bahan baku (stock-in), mendefinisikan resep dua level (base per Produk + topping per Variant), dan stok bahan otomatis terpotong saat nota mencapai `SELESAI_PRODUKSI`.

**Architecture:** 4 model Prisma baru (`Ingredient`, `IngredientPurchase`, `RecipeItem`, `IngredientMovement`). Deduction di-hook ke transaksi `setProductionProductStage` di `app/admin/(panel)/production/actions.ts` (satu transaksi, idempotent via `IngredientMovement`). Resep `RecipeItem.productId` = resep BASE (diwarisi semua varian), `RecipeItem.variantId` = resep TOPPING (khusus varian). Takaran `qtyPerUnit` per 1 pcs produk.

**Konfirmasi Hilmi:** trigger deduction = `SELESAI_PRODUKSI` (bukan `SELESAI`); takaran per pcs; branch baru dari master.

**Tech Stack:** Next.js 16 server components + server actions, Prisma 7 + Postgres, Tailwind, lucide-react. Tidak ada test runner terpasang → verifikasi via `npx tsc --noEmit` + `npm run build` + alur manual (konsisten dengan plan fitur sebelumnya).

---

## 0. Model Data (`prisma/schema.prisma`)

Tambah di akhir file (relasi balik ditambahkan juga: `Product.recipeItems`, `ProductVariant.recipeItems`, `Order.ingredientMovements`):

```prisma
model Ingredient {
  id          String  @id @default(cuid())
  name        String
  unit        String // "gram" | "ml" | "pcs" (bebas, master manual)
  stockQty    Float   @default(0)
  minStockQty Float   @default(0) // ambang alert stok rendah
  note        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  purchases IngredientPurchase[]
  recipeItems RecipeItem[]
  movements IngredientMovement[]

  @@map("ingredients")
}

model IngredientPurchase {
  id           String     @id @default(cuid())
  ingredientId String
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id], onDelete: Cascade)
  qty          Float // selalu masuk (stock-in)
  unitCost     Int        @default(0) // harga beli per unit (IDR)
  totalCost    Int        @default(0)
  supplier     String?
  note         String?
  purchasedAt  DateTime   @default(now())
  createdAt    DateTime   @default(now())

  @@index([ingredientId, purchasedAt])
  @@map("ingredient_purchases")
}

model RecipeItem {
  id           String @id @default(cuid())
  // BASE recipe: diisi productId (semua varian produk ini mewarisi)
  productId    String?
  product      Product?        @relation(fields: [productId], references: [id], onDelete: Cascade)
  // TOPPING recipe: diisi variantId (khusus varian ini)
  variantId    String?
  variant      ProductVariant? @relation(fields: [variantId], references: [id], onDelete: Cascade)
  ingredientId String
  ingredient   Ingredient      @relation(fields: [ingredientId], references: [id], onDelete: Cascade)
  qtyPerUnit   Float // takaran per 1 pcs produk
  note         String?

  @@index([productId])
  @@index([variantId])
  @@index([ingredientId])
  @@map("recipe_items")
}

enum IngredientMovementType {
  PURCHASE
  PRODUCTION_USE
  MANUAL_ADJUST
}

model IngredientMovement {
  id           String                @id @default(cuid())
  ingredientId String
  ingredient   Ingredient            @relation(fields: [ingredientId], references: [id], onDelete: Cascade)
  type         IngredientMovementType
  qty          Float // + masuk, - keluar
  orderId      String? // penyebab deduction (idempotency)
  order        Order?                @relation(fields: [orderId], references: [id], onDelete: SetNull)
  note         String?
  createdAt    DateTime              @default(now())

  @@index([ingredientId, createdAt])
  @@index([orderId])
  @@map("ingredient_movements")
}
```

**Migrasi:** `npx prisma format && npx prisma migrate dev --name add_inventory_ingredients` (jalankan di env dengan DATABASE_URL dev; jangan di produksi tanpa konfirmasi).

---

## 1. Tugas (bite-sized, urut)

### Task 1: Schema + migrasi
- Tambah 4 model + enum di atas ke `prisma/schema.prisma` + relasi balik (`recipeItems RecipeItem[]` di `Product` & `ProductVariant`, `ingredientMovements IngredientMovement[]` di `Order`).
- `npx prisma format && npx prisma generate`, lalu migrasi (perintah di atas).
- Verifikasi: `npx tsc --noEmit` masih hijau.

### Task 2: `lib/inventory-types.ts`
- Tipe: `IngredientRow { id, name, unit, stockQty, minStockQty, isLow, totalPurchased, recentPurchases[] }`, `RecipeRow { ingredientId, ingredientName, unit, qtyPerUnit }`, `RecipeMatrix { products: { productId, productName, base: RecipeRow[], variants: { variantId, variantName, topping: RecipeRow[] }[] } }`, `PurchaseInput`.

### Task 3: `lib/inventory.ts` (server-only)
- `getIngredients()`: list bahan + `isLow = stockQty <= minStockQty` + riwayat pembelian terakhir.
- `createIngredient(data)` & `updateIngredient(id, data)`.
- `createPurchase(input)`: **transaksi** — insert `IngredientPurchase` + increment `Ingredient.stockQty` + catat `IngredientMovement` (`PURCHASE`, `+qty`).
- `adjustStock(ingredientId, qty, note)`: manual koreksi (`MANUAL_ADJUST`).
- `getRecipeMatrix()`: gabung produk/varian + resep base/topping untuk UI `/admin/recipes`.
- `saveRecipeItem(...)` / `deleteRecipeItem(id)`.
- `computeOrderNeeds(items)`: pure — untuk tiap item: ambil `RecipeItem` by `productId` (BASE) **dan** `variantId` (TOPPING), kalikan `qtyPerUnit × item.quantity`, group per ingredient, return `Map<ingredientId, qty>`.
- `deductIngredientsForOrder(tx, orderId)`: **idempotent** — jika ada `IngredientMovement { orderId, type: PRODUCTION_USE }` → skip (aman saat produksi dibuka lagi & selesai ulang); selain itu transaksi: kurangi `stockQty` + insert movement per bahan (`PRODUCTION_USE`, `-qty`).

### Task 4: Hook deduction ke produksi
- Modify `app/admin/(panel)/production/actions.ts` (~line 153-161): di blok `if (toSelesaiProduksi.length > 0)`, **setelah** `updateMany` status, loop `for (const orderId of toSelesaiProduksi) { await deductIngredientsForOrder(tx, orderId); }` — tetap di dalam `tx` yang sama (atomic dengan perubahan status).

### Task 5: Navigasi
- `components/admin/admin-nav.ts`: grup baru **"Inventori"** (setelah Katalog): `Bahan Baku` → `/admin/ingredients` (icon `Package`), `Resep` → `/admin/recipes` (icon `ChefHat`).

### Task 6: Halaman Bahan Baku `app/admin/(panel)/ingredients/`
- `page.tsx` (server, `getIngredients()`) + `components/admin/ingredients/IngredientsClient.tsx` (client):
  - Stat cards: total jenis bahan, bahan stok rendah (merah), total nilai pembelian bulan ini.
  - Tabel: nama, stok `stockQty unit`, ambang, indikator `isLow` (badge merah), aksi: **Beli/Tambah Stok** (modal qty + unitCost + supplier), Edit (nama/unit/ambang), Riwayat pembelian.
  - Form tambah bahan baru.
- Server actions via `app/admin/(panel)/ingredients/actions.ts` (pola sama dengan `products/actions.ts`).

### Task 7: Halaman Resep `app/admin/(panel)/recipes/`
- `page.tsx` (server, `getRecipeMatrix()`) + `components/admin/recipes/RecipesClient.tsx` (client):
  - Accordion per produk → section "Base Recipe" + per varian "Topping Recipe".
  - Tambah baris resep: pilih bahan (dropdown dari `getIngredients`) + `qtyPerUnit` + unit tampil otomatis; hapus baris.
  - Info helper di header: "Base dipakai semua varian; topping hanya varian tsb. Stok terpotong saat nota SIAP semua (Selesai Produksi)."

### Task 8: Alert stok rendah di Dashboard (kecil)
- `app/admin/(panel)/page.tsx`: kartu "Stok Bahan Menipis" berisi bahan `isLow` (reuse `getIngredients`), link ke `/admin/ingredients`. Skip jika dashboard sudah padat — diskusi dulu.

### Task 9: Verifikasi akhir
- `npx tsc --noEmit` → 0 error.
- `npm run build` → sukses.
- Alur manual: (1) buat bahan "Tepung Kentang" 1000 gram; (2) resep base Donut: 50g tepung, resep topping varian Coklat: 15g coklat; (3) order Donut Coklat 10 pcs; (4) dorong produksi sampai semua SIAP → cek stok tepung -500g, coklat -150g; (5) mundurkan satu task lalu SIAP-kan lagi → pastikan stok TIDAK terpotong ulang (idempotent).

---

## 2. Keputusan desain (dari brainstorm)

| Keputusan | Nilai |
|---|---|
| Trigger deduction | Saat semua task nota `SIAP` → status `SELESAI_PRODUKSI` (di transaksi `setProductionProductStage`) |
| Idempotency | Cek `IngredientMovement.orderId` — produksi dibuka-ulang tidak double-deduct |
| Restock saat mundur ke DIPROSES | Tidak (bahan fisik sudah terpakai) |
| Resep | Dua level: `productId` = BASE, `variantId` = TOPPING; `qtyPerUnit` per pcs |
| HPP | `unitCost` disimpan sekarang, kalkulasi HPP per produk menyusul (YAGNI) |
| Satuan | String bebas per bahan (gram/ml/pcs), tanpa konversi otomatis (YAGNI) |
