import Link from "next/link";
import {
  ArrowUpRight,
  CakeSlice,
  Croissant,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { products } from "@/lib/products";
import PageHeading from "@/components/admin/PageHeading";
import ProductOverviewTable from "@/components/admin/ProductOverviewTable";
import StatCard from "@/components/admin/StatCard";

export default function AdminDashboardPage() {
  const totalVariants = products.reduce(
    (total, product) => total + (product.variants?.length ?? 0),
    0,
  );

  const bestSellers = products.reduce(
    (total, product) =>
      total +
      (product.variants?.filter((variant) =>
        variant.tags.includes("Best Seller"),
      ).length ?? 0),
    0,
  );

  const customProducts = products.filter(
    (product) => !product.hasVariants,
  ).length;

  const stats = [
    {
      label: "Kategori Produk",
      value: products.length,
      hint: "Koleksi aktif",
      icon: Layers,
      index: "01",
    },
    {
      label: "Total Varian",
      value: totalVariants,
      hint: "Rasa & ukuran",
      icon: Croissant,
      index: "02",
    },
    {
      label: "Best Seller",
      value: bestSellers,
      hint: "Ditandai pada varian",
      icon: TrendingUp,
      index: "03",
    },
    {
      label: "Custom Order",
      value: customProducts,
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
        description="Ringkasan katalog Cristin Luscious. Data produk masih dibaca dari file statis sampai modul pengelolaan produk dibuka."
        actions={
          <div className="border border-brand-border bg-brand-card px-3 py-2 font-sans text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text">
            Tahap 1 — Read-only
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
              Fondasi admin sudah aktif
            </p>
            <p className="mt-2 max-w-xl font-sans text-[11px] font-light leading-relaxed text-brand-text">
              Login, shell admin, dan ringkasan katalog sudah berjalan. Modul
              Produk, Pesanan, dan Pengaturan akan dibuka setelah tahap ini
              stabil.
            </p>
          </div>
        </div>

        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit shrink-0 items-center gap-2 border border-brand-dark bg-brand-dark px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors duration-300 hover:bg-transparent hover:text-brand-dark"
        >
          Lihat Website
          <ArrowUpRight size={13} />
        </Link>
      </div>
    </>
  );
}
