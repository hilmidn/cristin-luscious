import Link from "next/link";
import {
  ArrowUpRight,
  CakeSlice,
  Croissant,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import PageHeading from "@/components/admin/PageHeading";
import ProductOverviewTable from "@/components/admin/ProductOverviewTable";
import StatCard from "@/components/admin/StatCard";
import { getCatalogStats } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const statsData = await getCatalogStats();

  const stats = [
    {
      label: "Koleksi Produk",
      value: statsData.productCount,
      hint: `${statsData.publishedProductCount} aktif di website`,
      icon: Layers,
      index: "01",
    },
    {
      label: "Total Varian",
      value: statsData.variantCount,
      hint: "Rasa & ukuran",
      icon: Croissant,
      index: "02",
    },
    {
      label: "Best Seller",
      value: statsData.bestSellerCount,
      hint: "Ditandai pada varian",
      icon: TrendingUp,
      index: "03",
    },
    {
      label: "Custom Order",
      value: statsData.customCount,
      hint: "Tanpa varian tetap",
      icon: CakeSlice,
      index: "04",
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="Admin Atelier"
        title="Dashboard"
        accent="overview"
        description="Ringkasan katalog Cristin Luscious. Semua perubahan produk dan varian langsung tersimpan ke database dan tampil di website."
        actions={
          <div className="border border-brand-border bg-brand-card px-3 py-2 font-sans text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text">
            Katalog aktif
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-8">
        <ProductOverviewTable />
      </div>

      <div className="mt-8 flex flex-col gap-5 border border-dashed border-brand-border bg-brand-card/60 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <Sparkles
            size={18}
            strokeWidth={1.4}
            className="mt-0.5 shrink-0 text-brand-text"
          />
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-brand-dark">
              Modul produk &amp; pesanan sudah aktif
            </p>
            <p className="mt-2 max-w-xl font-sans text-[11px] font-light leading-relaxed text-brand-text">
              Tambah koleksi, atur varian, unggah gambar, dan catat pesanan
              masuk beserta ongkir dan invoice dari satu tempat. Modul
              Pengaturan menyusul.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/products"
            className="inline-flex w-fit shrink-0 items-center gap-2 border border-brand-dark bg-brand-dark px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors duration-300 hover:bg-transparent hover:text-brand-dark"
          >
            Kelola Produk
            <ArrowUpRight size={13} />
          </Link>

          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit shrink-0 items-center gap-2 border border-brand-border bg-brand-card px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-text transition-colors duration-300 hover:border-brand-dark hover:text-brand-dark"
          >
            Lihat Website
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </>
  );
}
