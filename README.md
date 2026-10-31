# Cristin Luscious

Website premium cookies & dessert Cristin Luscious, dengan area admin privat di `/admin`.

## Stack

- Next.js 16 (App Router, Turbopack)
- Tailwind CSS 4
- NextAuth v4 (credentials, JWT session)
- Prisma 7 + PostgreSQL (Neon)
- bcryptjs

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Setup Admin

1. Isi `.env.local`:

```env
DATABASE_URL="postgresql://...-pooler.../neondb?sslmode=require"
DIRECT_URL="postgresql://.../neondb?sslmode=require"
NEXTAUTH_SECRET="hasil openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_NAME="Cristin Admin"
ADMIN_EMAIL="admin@cristinluscious.com"
ADMIN_PASSWORD="password-minimal-8-karakter"
```

2. Jalankan migration dan seed admin:

```bash
npm run db:deploy
npm run db:seed
```

3. Buka `/admin`, login memakai `ADMIN_EMAIL` dan `ADMIN_PASSWORD`.

## Scripts

| Script | Fungsi |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Generate Prisma client + production build |
| `npm run db:deploy` | Jalankan migration ke database |
| `npm run db:push` | Sinkronisasi schema tanpa migration (prototyping) |
| `npm run db:seed` | Buat/perbarui akun admin |
| `npm run db:studio` | Prisma Studio |

## Struktur Rute

```text
app/(site)              Website publik
app/admin/login         Halaman login admin
app/admin/(panel)       Dashboard admin (butuh login)
app/admin/(panel)/orders    Pesanan & invoice (CRUD, ongkir, kode CL-YYMMDD-NNN)
app/admin/(panel)/production  Kalender produksi + tahap per item pesanan
app/api/auth/[...nextauth]  NextAuth handler
proxy.ts                Proteksi /admin/*
```

## Deploy ke Vercel + Neon

1. Set env `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` di Vercel.
2. `DATABASE_URL` memakai koneksi **pooled** Neon; `DIRECT_URL` memakai koneksi **direct**.
3. Jalankan `npm run db:deploy` dan `npm run db:seed` sekali dari lokal/CI yang terhubung ke Neon.
4. Build command sudah otomatis `prisma generate && next build`.
