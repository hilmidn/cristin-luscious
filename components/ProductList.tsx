"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog-types";

type ProductListProps = {
  products: CatalogProduct[];
};

export default function ProductList({ products }: ProductListProps) {
  return (
    <section
      id="products"
      className="relative py-24 md:py-36 bg-brand-bg text-brand-dark overflow-hidden border-t border-brand-border"
    >
      {/* Decorative vertical lines and accents */}
      <div className="absolute left-0 top-0 w-1/4 h-full border-r border-brand-border/40 pointer-events-none" />
      <div className="absolute right-0 top-0 w-1/4 h-full border-l border-brand-border/40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Section Header */}
        <div
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-6"
          data-aos="fade-up"
        >
          <div className="max-w-xl">
            <span className="text-xs font-semibold tracking-[0.4em] uppercase text-brand-text block mb-3">
              The Collection
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-brand-dark leading-none">
              Artisan <br />
              <span className="font-script text-3xl md:text-5xl text-brand-text font-light tracking-wide block lowercase mt-2">
                creations
              </span>
            </h2>
          </div>
          <div>
            <p className="max-w-sm font-sans text-xs md:text-sm text-brand-text font-light leading-relaxed tracking-wide">
              An elegant curation of fine patisserie categories, handcrafted
              daily to deliver unmatched luxury and aesthetic charm.
            </p>
          </div>
        </div>

        {/* Product Grid - Premium Editorial Design */}
        {products.length === 0 ? (
          <div className="border border-dashed border-brand-border bg-brand-card px-6 py-16 text-center">
            <p className="font-playfair text-xl font-bold text-brand-dark">
              Koleksi sedang disiapkan
            </p>
            <p className="mx-auto mt-2 max-w-md font-sans text-xs font-light leading-relaxed text-brand-text">
              Produk baru akan segera tampil di sini. Silakan kembali lagi atau
              hubungi kami untuk pemesanan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {products.map((product, index) => {
              const isFeatured = index === 0 || index === 3;

              return (
                <div
                  key={product.id}
                  className={`group relative flex flex-col justify-between border border-brand-border bg-brand-card p-6 md:p-8 transition-all duration-500 ease-in-out hover:border-brand-text ${
                    isFeatured ? "md:col-span-1 lg:col-span-1" : ""
                  }`}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                {/* Image Container with strict monochrome styling */}
                <div className="relative w-full aspect-square overflow-hidden border border-brand-border mb-6 bg-brand-card">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105 filter contrast-115"
                    sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 30vw"
                  />
                  <div className="absolute inset-0 bg-brand-dark/20 opacity-100 group-hover:opacity-10 transition-opacity duration-500" />

                  {/* Premium floating serial label */}
                  <span className="absolute top-4 left-4 text-[9px] tracking-widest font-mono text-brand-text bg-brand-card px-2.5 py-1 border border-brand-border">
                    COL-0{index + 1}
                  </span>
                </div>

                {/* Text Content */}
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-brand-text font-sans block mb-1">
                      {product.tagline}
                    </span>
                    <h3 className="font-playfair text-xl md:text-2xl text-brand-dark font-bold tracking-wide">
                      {product.name}
                    </h3>
                    <p className="font-sans text-xs md:text-sm text-brand-text font-light leading-relaxed mt-3">
                      {product.description}
                    </p>
                  </div>

                  {/* Highlights Bullet Tags */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-brand-border/60">
                    {product.features.map((feature, fIdx) => (
                      <span
                        key={fIdx}
                        className="text-[9px] font-semibold tracking-wider uppercase bg-brand-bg text-brand-text px-2.5 py-1 border border-brand-border"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Action Link */}
                  <div className="pt-4 flex justify-between items-center text-xs tracking-widest uppercase font-semibold text-brand-dark group-hover:text-brand-muted transition-colors">
                    <span>Lihat Detail</span>
                    <Link
                      href={`/products/${product.slug}`}
                      className="w-8 h-8 rounded-full border border-brand-border group-hover:border-brand-text flex items-center justify-center transition-colors duration-500"
                    >
                      <ArrowUpRight
                        size={14}
                        className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
