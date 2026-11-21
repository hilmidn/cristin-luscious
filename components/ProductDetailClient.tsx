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
    null
  );
  const [addedVariant, setAddedVariant] = useState<string | null>(null);

  const activeImage = productImageSrc(
    selectedVariant?.image.trim() ? selectedVariant.image : product.image,
  );
  const activePrice = selectedVariant?.price ?? null;
  const selectedStock =
    selectedVariant && stock ? stock[selectedVariant.id] : undefined;

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    addToCart(selectedVariant.id, 1);
    setAddedVariant(selectedVariant.id);
  };

  return (
    <main className="pt-24 pb-32 lg:pt-28 lg:pb-24">
      {/* ── Breadcrumb ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-6 lg:mb-10">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-16 items-start">

          {/* Left: Sticky Image */}
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <div className="relative w-full aspect-[4/3] sm:aspect-square overflow-hidden border border-brand-border group bg-brand-card">
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
              <div className="mt-4 hidden grid-cols-4 gap-3 lg:grid">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-label={`Pilih varian ${v.name}`}
                    aria-pressed={selectedVariant?.id === v.id}
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
                      src={productImageSrc(
                        v.image.trim() ? v.image : product.image,
                      )}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-6 flex flex-col space-y-4 sm:space-y-6 lg:space-y-8">

            {/* Product header */}
            <div>
              <span className="hidden text-[10px] tracking-[0.4em] uppercase text-brand-text font-semibold font-sans sm:mb-3 sm:block">
                Cristin&apos;s Luscious — {product.slug.replace(/-/g, " ")}
              </span>
              <h1 className="font-playfair text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-brand-dark leading-tight">
                {product.name}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="border border-brand-border bg-brand-bg px-2.5 py-1 font-sans text-[9px] font-semibold uppercase tracking-widest text-brand-text">
                  {selectedStock && selectedStock > 0
                    ? `Stok hari ini · ${selectedStock}`
                    : "Pre-order tersedia"}
                </span>
                {product.orderable && product.hasVariants && (
                  <a
                    href="#product-variants"
                    className="text-[10px] tracking-widest uppercase font-semibold text-brand-text underline underline-offset-4 decoration-brand-border transition-colors hover:text-brand-dark hover:decoration-brand-dark"
                  >
                    Pilih Varian
                  </a>
                )}
              </div>

              <div className="w-16 h-px bg-brand-border mt-4" />
            </div>

            {/* ── VARIANTS SECTION ── */}
            {product.hasVariants && product.variants ? (
              <div id="product-variants" className="space-y-3 scroll-mt-6">
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
                          type="button"
                          aria-pressed={isSelected}
                          className="w-full flex items-center justify-between p-4 text-left scroll-mb-[calc(6rem+env(safe-area-inset-bottom))] lg:scroll-mb-0"
                          onClick={() => {
                            setSelectedVariant(v);
                            setExpandedVariant(isOpen && isSelected ? null : v.id);
                          }}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="relative h-14 w-14 shrink-0 overflow-hidden border border-brand-border bg-brand-bg lg:hidden">
                              <Image
                                src={productImageSrc(
                                  v.image.trim() ? v.image : product.image,
                                )}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            </span>
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
                                {stock?.[v.id] !== undefined && (
                                    <span
                                      className={`text-[8px] tracking-widest uppercase px-2 py-0.5 border ${
                                        (stock[v.id] ?? 0) > 0
                                          ? "bg-brand-card border-brand-border text-brand-dark"
                                          : "bg-brand-bg border-brand-border text-brand-muted"
                                      }`}
                                    >
                                      {(stock[v.id] ?? 0) > 0
                                        ? `Stok hari ini ${stock[v.id]}`
                                        : "Pre-order tersedia"}
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

            {/* Price display */}
            {activePrice && (
              <div className="pt-2">
                <p className="text-[10px] tracking-widest uppercase text-brand-text font-sans">Harga</p>
                <p className="font-playfair text-3xl font-bold text-brand-dark mt-1">{activePrice}</p>
              </div>
            )}

            {/* Tambah ke keranjang — hanya produk orderable ber-varian */}
            {product.orderable && product.hasVariants && selectedVariant && (
              <div className="hidden space-y-2 lg:block">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex w-full items-center justify-center gap-3 px-8 py-4 border border-brand-dark bg-brand-card font-semibold text-xs uppercase tracking-widest text-brand-dark hover:bg-brand-dark hover:text-brand-bg transition-all duration-300 disabled:cursor-not-allowed disabled:border-brand-border disabled:text-brand-muted disabled:hover:bg-brand-card"
                >
                  <ShoppingBag size={14} />
                  Tambah ke Keranjang
                </button>

                <p className="text-center font-sans text-[10px] tracking-wide text-brand-text">
                  {selectedStock && selectedStock > 0
                    ? "Bisa diambil hari ini jika stok seluruh keranjang mencukupi."
                    : "Tetap bisa dipesan sebagai pre-order, mulai H+3 saat checkout."}
                  {addedVariant === selectedVariant.id && (
                    <span
                      className="ml-2 font-semibold text-brand-dark"
                      aria-live="polite"
                    >
                      ✓ Ditambahkan ke keranjang
                    </span>
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

      {product.orderable && product.hasVariants && selectedVariant && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-border bg-brand-bg/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_24px_rgba(28,27,25,0.08)] backdrop-blur-sm lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-sans text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-text">
                {selectedVariant.name}
              </p>
              <p className="truncate font-playfair text-lg font-bold text-brand-dark">
                {activePrice ?? "Harga menyusul"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex shrink-0 items-center justify-center gap-2 border border-brand-dark bg-brand-dark px-4 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark disabled:cursor-not-allowed disabled:border-brand-border disabled:bg-transparent disabled:text-brand-muted"
            >
              <ShoppingBag size={14} />
              Tambah ke Keranjang
            </button>
          </div>
          {addedVariant === selectedVariant.id && (
            <p
              className="mx-auto mt-2 block max-w-7xl text-center font-sans text-[10px] font-semibold text-brand-dark"
              aria-live="polite"
            >
              ✓ Ditambahkan ke keranjang
            </p>
          )}
        </div>
      )}

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
