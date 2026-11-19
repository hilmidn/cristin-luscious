"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { submitWebOrder } from "@/app/(site)/order/actions";
import {
  cartTotalQty,
  clearCart,
  getCartSnapshot,
  parseCartSnapshot,
  removeFromCart,
  setCartQty,
  subscribeCart,
} from "@/lib/cart-store";
import { productImageSrc, type CatalogProduct, type CatalogVariant } from "@/lib/catalog-types";
import { Minus, Plus, ShoppingBag, Trash2, Loader2, Check } from "lucide-react";

type OrderFlowProps = {
  /** Hanya produk orderable ber-varian — difilter di page. */
  products: CatalogProduct[];
  /** variantId -> stok jadi hari ini. */
  stock: Record<string, number>;
  /** Hari ini menurut WIB, format YYYY-MM-DD. */
  today: string;
};

const MAX_WEB_QTY = 99;

function formatTanggal(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

type CartRow = {
  variant: CatalogVariant;
  product: CatalogProduct;
  quantity: number;
};

export default function OrderFlow({ products, stock, today }: OrderFlowProps) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(today);

  // Keranjang = external store (localStorage) — React resinkron otomatis,
  // server snapshot kosong supaya hydration aman.
  const cartSnapshot = useSyncExternalStore(subscribeCart, getCartSnapshot, () => "");
  const cart = useMemo(() => parseCartSnapshot(cartSnapshot), [cartSnapshot]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isPickupToday = date === today;

  const variantIndex = useMemo(() => {
    const map = new Map<string, { product: CatalogProduct; variant: CatalogVariant }>();

    for (const product of products) {
      for (const variant of product.variants) {
        map.set(variant.id, { product, variant });
      }
    }

    return map;
  }, [products]);

  const rows = useMemo<CartRow[]>(() => {
    return Object.entries(cart)
      .map(([variantId, quantity]) => {
        const found = variantIndex.get(variantId);
        return found ? { variant: found.variant, product: found.product, quantity } : null;
      })
      .filter((row): row is CartRow => row !== null);
  }, [cart, variantIndex]);

  const unavailableCount = useMemo(
    () =>
      Object.keys(cart).filter((variantId) => !variantIndex.has(variantId)).length,
    [cart, variantIndex],
  );

  const usesStock = (product: CatalogProduct) =>
    product.fulfillmentMode === "READY" && isPickupToday;

  const maxQty = (product: CatalogProduct, variantId: string) =>
    usesStock(product) ? (stock[variantId] ?? 0) : MAX_WEB_QTY;

  const total = rows.reduce(
    (acc, row) => acc + (row.variant.priceAmount ?? 0) * row.quantity,
    0,
  );
  const hasUnpriced = rows.some((row) => row.variant.priceAmount === null);

  const shortage = rows.some(
    (row) => usesStock(row.product) && row.quantity > (stock[row.variant.id] ?? 0),
  );

  const handleSubmit = () => {
    setError(null);

    if (rows.length === 0) {
      setError("Keranjang masih kosong.");
      return;
    }

    if (!customerName.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    if (phone.replace(/\D/g, "").length < 9) {
      setError("Nomor HP tidak valid. Contoh: 08123456789.");
      return;
    }

    if (shortage) {
      setError("Ada item yang stoknya tidak cukup untuk hari ini — kurangi jumlahnya.");
      return;
    }

    startTransition(async () => {
      const result = await submitWebOrder({
        customerName,
        phone,
        note,
        scheduledAt: date,
        items: rows.map((row) => ({
          variantId: row.variant.id,
          quantity: row.quantity,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      clearCart();
      setSuccess(result.code);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const inputClass =
    "w-full border border-brand-border bg-brand-bg px-4 py-3 font-sans text-xs text-brand-dark outline-none transition-colors placeholder:text-brand-muted focus:border-brand-dark";

  const labelClass =
    "mb-2 block font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-brand-text";

  // =========================== SUKSES ===========================
  if (success) {
    return (
      <section className="relative min-h-screen bg-brand-bg py-24 md:py-32">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-1/4 border-r border-brand-border/40" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/4 border-l border-brand-border/40" />

        <div className="relative z-10 mx-auto max-w-xl px-6">
          <div className="border border-brand-border bg-brand-card p-8 text-center md:p-12">
            <span className="inline-flex h-12 w-12 items-center justify-center border border-brand-dark bg-brand-dark text-brand-bg">
              <Check className="h-5 w-5" />
            </span>

            <h1 className="mt-6 font-playfair text-3xl font-bold uppercase tracking-tight text-brand-dark">
              Pesanan Diterima
            </h1>

            <p className="mt-3 font-sans text-xs leading-relaxed text-brand-text">
              Simpan kode ini sebagai bukti pesanan. Kami akan hubungi via
              WhatsApp bila ada yang perlu dikonfirmasi.
            </p>

            <p className="mt-6 border border-brand-dark bg-brand-bg px-6 py-4 font-mono text-2xl font-bold tracking-wider text-brand-dark">
              {success}
            </p>

            <div className="mt-8 space-y-2 border-t border-brand-border pt-6 text-left font-sans text-xs text-brand-text">
              <p>
                <span className="uppercase tracking-[0.18em]">Nama</span>{" "}
                <span className="float-right text-brand-dark">{customerName}</span>
              </p>
              <p>
                <span className="uppercase tracking-[0.18em]">Ambil pada</span>{" "}
                <span className="float-right text-brand-dark">{formatTanggal(date)}</span>
              </p>
              <p>
                <span className="uppercase tracking-[0.18em]">Metode</span>{" "}
                <span className="float-right text-brand-dark">Ambil di toko</span>
              </p>
              <p>
                <span className="uppercase tracking-[0.18em]">Pembayaran</span>{" "}
                <span className="float-right text-brand-dark">Saat pengambilan</span>
              </p>
            </div>

            <Link
              href="/#products"
              className="mt-8 block w-full border border-brand-dark bg-brand-dark px-6 py-3.5 text-center font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
            >
              Lanjut Lihat Katalog
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // =========================== CHECKOUT ===========================
  return (
    <section className="relative bg-brand-bg py-24 md:py-32">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-1/4 border-r border-brand-border/40" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/4 border-l border-brand-border/40" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header */}
        <div className="mb-12 max-w-xl md:mb-16">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.4em] text-brand-text">
            Order Online
          </span>
          <h1 className="font-playfair text-4xl font-bold uppercase leading-none tracking-tight text-brand-dark md:text-5xl">
            Keranjang{" "}
            <span className="block font-script text-3xl font-light lowercase tracking-wide text-brand-text md:text-4xl">
              checkout
            </span>
          </h1>
          <p className="mt-4 font-sans text-xs font-light leading-relaxed tracking-wide text-brand-text md:text-sm">
            Periksa keranjang, isi nama dan nomor HP, lalu ambil langsung di
            toko sesuai tanggal yang dipilih. Pembayaran saat pengambilan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ── Isi keranjang ── */}
          <div>
            {/* Tanggal ambil */}
            <div className="mb-8 border border-brand-border bg-brand-card p-5 md:p-6">
              <label htmlFor="tanggal" className={labelClass}>
                Tanggal Ambil
              </label>
              <input
                id="tanggal"
                type="date"
                min={today}
                value={date}
                onChange={(event) => setDate(event.target.value || today)}
                className="w-full border border-brand-border bg-brand-bg px-4 py-3 font-sans text-xs text-brand-dark outline-none focus:border-brand-dark sm:max-w-xs"
              />
              <p className="mt-3 font-sans text-[11px] leading-relaxed text-brand-text">
                {isPickupToday
                  ? "Produk ready stock diambil dari stok hari ini. Produk pre-order perlu waktu pembuatan — pilih tanggal lain."
                  : `Semua item dibuat untuk diambil ${formatTanggal(date)}.`}
              </p>
            </div>

            {rows.length === 0 && unavailableCount === 0 ? (
              <div className="border border-dashed border-brand-border bg-brand-card px-6 py-16 text-center">
                <ShoppingBag className="mx-auto h-8 w-8 text-brand-muted" />
                <p className="mt-4 font-playfair text-xl font-bold text-brand-dark">
                  Keranjang masih kosong
                </p>
                <p className="mx-auto mt-2 max-w-sm font-sans text-xs leading-relaxed text-brand-text">
                  Tambahkan produk favoritmu dari halaman katalog, lalu kembali
                  ke sini untuk checkout.
                </p>
                <Link
                  href="/#products"
                  className="mt-6 inline-block border border-brand-dark bg-brand-dark px-6 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
                >
                  Lihat Katalog
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map(({ product, variant, quantity }) => {
                  const ready = product.fulfillmentMode === "READY";
                  const limit = maxQty(product, variant.id);
                  const overLimit = usesStock(product) && quantity > limit;
                  const sisa = stock[variant.id] ?? 0;

                  return (
                    <div
                      key={variant.id}
                      className={`border bg-brand-card p-4 md:p-5 ${
                        overLimit ? "border-red-500" : "border-brand-border"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className="h-16 w-16 shrink-0 border border-brand-border bg-brand-bg bg-cover bg-center"
                          style={{ backgroundImage: `url(${productImageSrc(variant.image || product.image)})` }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-text">
                                {product.name}
                              </p>
                              <p className="truncate font-playfair text-base font-bold text-brand-dark">
                                {variant.name}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] text-brand-text">
                                {variant.price ?? "Harga menyusul"}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(variant.id)}
                              aria-label="Hapus dari keranjang"
                              className="p-1.5 text-brand-muted transition-colors hover:text-brand-dark"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center border border-brand-border bg-brand-bg">
                              <button
                                onClick={() => setCartQty(variant.id, quantity - 1)}
                                aria-label="Kurangi"
                                className="px-3 py-2 text-brand-text transition-colors hover:text-brand-dark"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-8 text-center font-mono text-xs font-semibold text-brand-dark">
                                {quantity}
                              </span>
                              <button
                                onClick={() => setCartQty(variant.id, quantity + 1)}
                                disabled={quantity >= limit}
                                aria-label="Tambah"
                                className="px-3 py-2 text-brand-text transition-colors hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="font-mono text-sm font-semibold text-brand-dark">
                                {variant.priceAmount === null
                                  ? "—"
                                  : formatRupiah(variant.priceAmount * quantity)}
                              </p>
                              <p
                                className={`font-sans text-[9px] font-semibold uppercase tracking-[0.16em] ${
                                  overLimit ? "text-red-600" : "text-brand-text"
                                }`}
                              >
                                {ready
                                  ? isPickupToday
                                    ? overLimit
                                      ? `Melebihi stok — sisa ${sisa}`
                                      : `Sisa ${sisa} hari ini`
                                    : "Dibuat untuk tanggal terpilih"
                                  : "Pre-order"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Item cart yang produknya sudah tidak bisa dipesan */}
                {unavailableCount > 0 && (
                  <div className="border border-red-500 bg-red-50/60 p-4 font-sans text-[11px] text-red-700">
                    {unavailableCount} item di keranjang tidak tersedia lagi —
                    itemnya diabaikan saat checkout. Perbarui keranjang dari
                    halaman katalog.
                  </div>
                )}

                {isPickupToday && rows.length > 0 && (
                  <p className="font-sans text-[11px] leading-relaxed text-brand-text">
                    Stok hari ini terbatas — kalau produk ready di keranjang
                    sudah habis, ganti tanggal ambil untuk menjadikannya
                    pre-order.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Data pemesan + submit ── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-brand-border bg-brand-card">
              <div className="border-b border-brand-border px-5 py-4">
                <h2 className="flex items-center gap-2 font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                  <ShoppingBag className="h-4 w-4" />
                  Data Pemesan
                  {cartTotalQty(cart) > 0 && (
                    <span className="ml-auto font-mono text-xs text-brand-text">
                      {cartTotalQty(cart)} item
                    </span>
                  )}
                </h2>
              </div>

              <div className="px-5 py-5">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="nama" className={labelClass}>
                      Nama
                    </label>
                    <input
                      id="nama"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Nama kamu"
                      className={inputClass}
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <label htmlFor="hp" className={labelClass}>
                      Nomor HP
                    </label>
                    <input
                      id="hp"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="08123456789"
                      className={inputClass}
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <label htmlFor="catatan" className={labelClass}>
                      Catatan{" "}
                      <span className="font-normal tracking-normal text-brand-muted">
                        (opsional)
                      </span>
                    </label>
                    <textarea
                      id="catatan"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={2}
                      placeholder="Contoh: less sugar, ambil sore"
                      className={`${inputClass} resize-y`}
                      maxLength={500}
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-brand-border pt-4 font-sans text-xs">
                    <span className="uppercase tracking-[0.18em] text-brand-text">
                      Estimasi
                    </span>
                    <span className="font-mono text-sm font-bold text-brand-dark">
                      {rows.length === 0
                        ? "—"
                        : hasUnpriced
                          ? "Dikonfirmasi admin"
                          : formatRupiah(total)}
                    </span>
                  </div>

                  {error && (
                    <div className="border border-red-500 bg-red-50 px-4 py-3 font-sans text-[11px] font-semibold text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={isPending || rows.length === 0 || shortage}
                    className="flex w-full items-center justify-center gap-2.5 border border-brand-dark bg-brand-dark px-6 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark disabled:cursor-not-allowed disabled:border-brand-border disabled:bg-transparent disabled:text-brand-muted"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingBag className="h-4 w-4" />
                    )}
                    Kirim Pesanan
                  </button>

                  <p className="text-center font-sans text-[10px] leading-relaxed text-brand-text">
                    Tanpa akun · Ambil di toko ({formatTanggal(date)}) · Bayar
                    saat ambil
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
