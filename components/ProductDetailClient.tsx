"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShoppingBag, Check, ChevronDown, MessageCircle } from "lucide-react";
import {
  productImageSrc,
  type CatalogProduct,
  type CatalogVariant,
} from "@/lib/catalog-types";
import { addToCart } from "@/lib/cart-store";

interface Props {
  product: CatalogProduct;
  relatedProducts: CatalogProduct[];
  /** variantId -> stok jadi hari ini (untuk tombol keranjang). */
  stock?: Record<string, number>;
}

export default function ProductDetailClient({
  product,
  relatedProducts,
  stock,
}: Props) {
  const [selectedVariant, setSelectedVariant] = useState<CatalogVariant | null>(
    product.variants?.[0] ?? null
  );
  const [expandedVariant, setExpandedVariant] = useState<string | null>(
    product.variants?.[0]?.id ?? null
  );
  const [addedVariant, setAddedVariant] = useState<string | null>(null);

  const activeImage = productImageSrc(selectedVariant?.image || product.image);
  const activePrice = selectedVariant?.price ?? null;

  return (
    <main className="pt-28 pb-24">
      {/* ── Breadcrumb ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-10">
        <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-brand-text font-sans">
          <Link href="/" className="hover:text-brand-dark transition-colors">Home</Link>
          <span>/</span>
          <Link href="/#products" className="hover:text-brand-dark transition-colors">Creations</Link>
          <span>/</span>
          <span className="text-brand-dark font-semibold">{product.name}</span>
        </div>
      </div>

      {/* ── Hero Split ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left: Sticky Image */}
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <div className="relative w-full aspect-square overflow-hidden border border-brand-border group bg-brand-card">
              {/* Decorative offset frame */}
              <div className="absolute inset-0 border border-brand-border translate-x-3 translate-y-3 -z-10 pointer-events-none" />
              <Image
                src={activeImage}
                alt={selectedVariant?.name ?? product.name}
                fill
                priority
                className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Overlay gradient bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/10 via-transparent to-transparent" />

              {/* Category badge */}
              <div className="absolute top-5 left-5 px-3 py-1.5 bg-brand-bg border border-brand-border">
                <span className="text-[9px] tracking-[0.3em] uppercase font-semibold font-sans text-brand-text">
                  {product.tagline}
                </span>
              </div>
            </div>

            {/* Variant thumbnail strip (for products with variants) */}
            {product.hasVariants && product.variants && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v);
                      setExpandedVariant(v.id);
                    }}
                    className={`relative aspect-square overflow-hidden border-2 transition-all duration-300 ${
                      selectedVariant?.id === v.id
                        ? "border-brand-dark"
                        : "border-brand-border hover:border-brand-text"
                    }`}
                  >
                    <Image
                      src={productImageSrc(v.image)}
                      alt={v.name}
                      fill
                      className="object-cover"
                      sizes="10vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-6 flex flex-col space-y-8">

            {/* Product header */}
            <div>
              <span className="text-[10px] tracking-[0.4em] uppercase text-brand-text font-semibold font-sans block mb-3">
                Cristin&apos;s Luscious — {product.slug.replace(/-/g, " ")}
              </span>
              <h1 className="font-playfair text-4xl md:text-5xl font-bold uppercase tracking-tight text-brand-dark leading-tight">
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  className={`px-2.5 py-1 text-[9px] font-semibold tracking-widest uppercase font-sans border ${
                    product.fulfillmentMode === "READY"
                      ? "bg-brand-dark text-brand-bg border-brand-dark"
                      : "bg-brand-bg text-brand-text border-brand-border"
                  }`}
                >
                  {product.fulfillmentMode === "READY" ? "Ready Stock" : "Pre-order"}
                </span>
                <Link
                  href="/order"
                  className="text-[10px] tracking-widest uppercase font-semibold text-brand-text underline underline-offset-4 decoration-brand-border transition-colors hover:text-brand-dark hover:decoration-brand-dark"
                >
                  Pesan via Web
                </Link>
              </div>

              <div className="w-16 h-px bg-brand-border mt-5" />
            </div>

            {/* Product description */}
            <p className="font-sans text-sm md:text-base text-brand-text font-light leading-relaxed">
              {product.description}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {product.features.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-border bg-brand-card">
                  <Check size={10} className="text-brand-dark shrink-0" />
                  <span className="text-[9px] font-semibold tracking-widest uppercase text-brand-text">
                    {f}
                  </span>
                </div>
              ))}
            </div>

            {/* ── VARIANTS SECTION ── */}
            {product.hasVariants && product.variants ? (
              <div className="space-y-3">
                <h2 className="text-[10px] tracking-[0.4em] uppercase font-semibold text-brand-text font-sans">
                  Pilih Varian
                </h2>

                <div className="space-y-2">
                  {product.variants.map((v) => {
                    const isOpen = expandedVariant === v.id;
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <div
                        key={v.id}
                        className={`border transition-all duration-300 ${
                          isSelected
                            ? "border-brand-dark bg-brand-card"
                            : "border-brand-border bg-brand-bg hover:border-brand-text"
                        }`}
                      >
                        {/* Variant header — click to expand and select */}
                        <button
                          className="w-full flex items-center justify-between p-4 text-left"
                          onClick={() => {
                            setSelectedVariant(v);
                            setExpandedVariant(isOpen && isSelected ? null : v.id);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {/* Radio indicator */}
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? "border-brand-dark" : "border-brand-border"
                            }`}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-brand-dark" />
                              )}
                            </div>
                            <div>
                              <p className="font-playfair text-sm font-semibold text-brand-dark">
                                {v.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="font-sans text-[10px] text-brand-text">
                                  {v.price}
                                </p>
                                {product.fulfillmentMode === "READY" &&
                                  stock?.[v.id] !== undefined && (
                                    <span
                                      className={`text-[8px] tracking-widest uppercase px-2 py-0.5 border ${
                                        (stock[v.id] ?? 0) > 0
                                          ? "bg-brand-card border-brand-border text-brand-dark"
                                          : "bg-brand-bg border-brand-border text-brand-muted"
                                      }`}
                                    >
                                      {(stock[v.id] ?? 0) > 0
                                        ? `Stok ${stock[v.id]}`
                                        : "Habis"}
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {v.tags.slice(0, 1).map((tag) => (
                              <span key={tag} className="hidden sm:block text-[8px] tracking-widest uppercase bg-brand-bg border border-brand-border px-2 py-1 text-brand-text">
                                {tag}
                              </span>
                            ))}
                            <ChevronDown
                              size={14}
                              className={`text-brand-text transition-transform duration-300 ${isOpen && isSelected ? "rotate-180" : ""}`}
                            />
                          </div>
                        </button>

                        {/* Expanded description */}
                        <div className={`overflow-hidden transition-all duration-300 ${isOpen && isSelected ? "max-h-48" : "max-h-0"}`}>
                          <div className="px-4 pb-4 pt-0 border-t border-brand-border">
                            <p className="font-sans text-xs text-brand-text font-light leading-relaxed mt-3">
                              {v.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {v.tags.map((tag) => (
                                <span key={tag} className="text-[8px] tracking-widest uppercase bg-brand-bg border border-brand-border px-2 py-1 text-brand-text">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Custom cake — no variant, just a note */
              product.customNote && (
                <div className="p-6 bg-brand-card border border-brand-border space-y-3">
                  <p className="text-[10px] tracking-widest uppercase font-semibold text-brand-text font-sans">
                    How It Works
                  </p>
                  <p className="font-sans text-sm text-brand-text font-light leading-relaxed">
                    {product.customNote}
                  </p>
                </div>
              )
            )}

            {/* Price display */}
            {activePrice && (
              <div className="pt-2">
                <p className="text-[10px] tracking-widest uppercase text-brand-text font-sans">Harga Mulai</p>
                <p className="font-playfair text-3xl font-bold text-brand-dark mt-1">{activePrice}</p>
              </div>
            )}

            {/* Tambah ke keranjang — hanya produk orderable ber-varian */}
            {product.orderable && product.hasVariants && selectedVariant && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    addToCart(selectedVariant.id, 1);
                    setAddedVariant(selectedVariant.id);
                  }}
                  disabled={product.fulfillmentMode === "READY" && (stock?.[selectedVariant.id] ?? 0) <= 0}
                  className="flex w-full items-center justify-center gap-3 px-8 py-4 border border-brand-dark bg-brand-card font-semibold text-xs uppercase tracking-widest text-brand-dark hover:bg-brand-dark hover:text-brand-bg transition-all duration-300 disabled:cursor-not-allowed disabled:border-brand-border disabled:text-brand-muted disabled:hover:bg-brand-card"
                >
                  <ShoppingBag size={14} />
                  {product.fulfillmentMode === "READY" && (stock?.[selectedVariant.id] ?? 0) <= 0
                    ? "Habis hari ini — pesan lewat tanggal lain"
                    : "Tambah ke Keranjang"}
                </button>

                <p className="text-center font-sans text-[10px] tracking-wide text-brand-text">
                  {product.fulfillmentMode === "READY"
                    ? `Ready stock${stock?.[selectedVariant.id] !== undefined ? ` — sisa ${stock[selectedVariant.id]} hari ini` : ""}`
                    : "Pre-order — pilih tanggal ambil saat checkout"}
                  {addedVariant === selectedVariant.id && (
                    <Link
                      href="/order"
                      className="ml-2 font-semibold text-brand-dark underline underline-offset-4 decoration-brand-border hover:decoration-brand-dark"
                    >
                      ✓ Ditambahkan — buka keranjang
                    </Link>
                  )}
                </p>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-brand-border">
              <a
                href="https://wa.me/6289688264931"
                target="_blank"
                rel="noreferrer"
                className="group flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-brand-dark text-brand-bg font-semibold text-xs uppercase tracking-widest hover:bg-brand-text transition-all duration-500"
              >
                <MessageCircle size={14} />
                <span>Ask About This Product</span>
              </a>
              <Link
                href="/#products"
                className="flex items-center justify-center gap-2 px-6 py-4 border border-brand-border text-xs font-semibold uppercase tracking-widest text-brand-dark hover:border-brand-dark transition-colors duration-300"
              >
                <ArrowLeft size={14} />
                <span>Back to All</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Related Products ── */}
      <RelatedProducts currentSlug={product.slug} products={relatedProducts} />
    </main>
  );
}

// ─────────────────────────────────────────
// Related Products strip at bottom
// ─────────────────────────────────────────
function RelatedProducts({
  currentSlug,
  products,
}: {
  currentSlug: string;
  products: CatalogProduct[];
}) {
  const related = products.filter((p) => p.slug !== currentSlug).slice(0, 4);
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-24 pt-16 border-t border-brand-border">
      <div className="flex items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-[10px] tracking-[0.4em] uppercase text-brand-text font-semibold font-sans block mb-2">
            Explore More
          </span>
          <h2 className="font-playfair text-2xl md:text-3xl font-bold uppercase text-brand-dark">
            Other Creations
          </h2>
        </div>
        <Link
          href="/#products"
          className="hidden sm:flex items-center gap-2 text-[10px] tracking-widest uppercase font-semibold text-brand-text hover:text-brand-dark transition-colors"
        >
          <span>View All</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {related.map((p) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className="group flex flex-col border border-brand-border bg-brand-card hover:border-brand-text transition-all duration-300"
          >
            <div className="relative w-full aspect-square overflow-hidden bg-brand-bg">
              <Image
                src={productImageSrc(p.image)}
                alt={p.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
            <div className="p-4 space-y-1">
              <p className="text-[9px] tracking-widest uppercase text-brand-text font-sans">{p.tagline}</p>
              <h3 className="font-playfair text-sm font-bold text-brand-dark group-hover:text-brand-text transition-colors">
                {p.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
