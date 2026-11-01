-- Status baru: produksi selesai tetapi pesanan belum diambil / diantar.
ALTER TYPE "OrderStatus" ADD VALUE 'SELESAI_PRODUKSI' BEFORE 'SELESAI';
