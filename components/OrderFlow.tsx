"use client";

import { useMemo, useState, useTransition } from "react";
import { submitWebOrder } from "@/app/(site)/order/actions";
import { productImageSrc, type CatalogProduct, type CatalogVariant } from "@/lib/catalog-types";
import { Minus, Plus, ShoppingBag, Loader2, Check } from "lucide-react";

type OrderFlowProps = {
  products: CatalogProduct[];
  /** variantId → stok jadi hari ini. */
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

export default function OrderFlow({ products, stock, today }: OrderFlowProps) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(today);
  const [cart, setCart] = useState<Record<string, number>>({});
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

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([variantId, quantity]) => ({
          quantity,
          ...(variantIndex.get(variantId) ?? { product: null, variant: null }),
        }))
        .filter(
          (item): item is { product: CatalogProduct; variant: CatalogVariant; quantity: number } =>
            Boolean(item.product && item.variant) && item.quantity > 0,
        ),
    [cart, variantIndex],
  );

  const usesStock = (product: CatalogProduct) =>
    product.fulfillmentMode === "READY" && isPickupToday;

  const maxQty = (product: CatalogProduct, variantId: string) =>
    usesStock(product) ? (stock[variantId] ?? 0) : MAX_WEB_QTY;

  const total = cartItems.reduce(
    (acc, item) => acc + (item.variant.priceAmount ?? 0) * item.quantity,
    0,
  );
  const hasUnpriced = cartItems.some((item) => item.variant.priceAmount === null);

  const shortage = cartItems.some(
    (item) => usesStock(item.product) && item.quantity > (stock[item.variant.id] ?? 0),
  );

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  function setQty(variantId: string, next: number) {
    setCart((current) => {
      const value = Math.max(0, Math.min(MAX_WEB_QTY, next));

      if (value === 0) {
        const next = { ...current };
        delete next[variantId];
        return next;
      }

      return { ...current, [variantId]: value };
    });
  }

  function handleSubmit() {
    setError(null);

    if (cartItems.length === 0) {
      setError("Pilih minimal satu produk dulu.");
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
      setError("Ada item yang stoknya tidak cukup untuk hari ini.");
      return;
    }

    startTransition(async () => {
      const result = await submitWebOrder({
        customerName,
        phone,
        note,
        scheduledAt: date,
        items: cartItems.map((item) => ({
          variantId: item.variant.id,
          quantity: item.quantity,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess(result.code);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function resetOrder() {
    setSuccess(null);
    setCart({});
    setCustomerName("");
    setPhone("");
    setNote("");
    setDate(today);
  }

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

            <button
              onClick={resetOrder}
              className="mt-8 w-full border border-brand-dark bg-brand-dark px-6 py-3.5 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
            >
              Buat Pesanan Baru
            </button>
          </div>
        </div>
      </section>
    );
  }

  // =========================== FORM ===========================
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
            Pesan{" "}
            <span className="block font-script text-3xl font-light lowercase tracking-wide text-brand-text md:text-4xl">
              untuk diambil
            </span>
          </h1>
          <p className="mt-4 font-sans text-xs font-light leading-relaxed tracking-wide text-brand-text md:text-sm">
            Pilih produk, isi nama dan nomor HP, lalu ambil langsung di toko
            sesuai tanggal yang dipilih. Pembayaran dilakukan saat pengambilan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Katalog */}
          <div>
            {/* Tanggal ambil */}
            <div className="mb-10 border border-brand-border bg-brand-card p-5 md:p-6">
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

            {/* Produk */}
            <div className="space-y-8">
              {products.length === 0 && (
                <p className="border border-dashed border-brand-border bg-brand-card px-6 py-14 text-center font-sans text-xs text-brand-text">
                  Katalog sedang disiapkan.
                </p>
              )}

              {products.map((product) => (
                <div
                  key={product.id}
                  className="border border-brand-border bg-brand-card"
                >
                  <div className="flex items-center gap-4 border-b border-brand-border p-4 md:p-5">
                    <span
                      className="h-14 w-14 shrink-0 border border-brand-border bg-brand-bg bg-cover bg-center"
                      style={{ backgroundImage: `url(${productImageSrc(product.image)})` }}
                    />
                    <div className="min-w-0">
                      <h2 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                        {product.name}
                      </h2>
                      <p className="truncate font-sans text-[11px] font-light text-brand-text">
                        {product.tagline}
                      </p>
                    </div>
                  </div>

                  {product.variants.length === 0 ? (
                    <p className="p-4 font-sans text-[11px] leading-relaxed text-brand-text md:p-5">
                      {product.customNote ??
                        "Produk custom — dikerjakan sesuai permintaan. Hubungi kami untuk pemesanan."}
                    </p>
                  ) : (
                    <div className="divide-y divide-brand-border">
                      {product.variants.map((variant) => {
                        const qty = cart[variant.id] ?? 0;
                        const ready = product.fulfillmentMode === "READY";
                        const sisa = stock[variant.id] ?? 0;
                        const limit = maxQty(product, variant.id);
                        const habis = ready && isPickupToday && sisa <= 0;

                        return (
                          <div
                            key={variant.id}
                            className="flex items-center justify-between gap-4 p-4 md:p-5"
                          >
                            <div className="min-w-0">
                              <p className="font-sans text-xs font-semibold text-brand-dark">
                                {variant.name}
                              </p>
                              <p className="mt-0.5 font-mono text-[11px] text-brand-text">
                                {variant.price ?? "Harga menyusul"}
                              </p>
                              <p
                                className={`mt-1 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] ${
                                  habis ? "text-red-600" : "text-brand-text"
                                }`}
                              >
                                {ready
                                  ? isPickupToday
                                    ? habis
                                      ? "Habis hari ini — bisa pre-order"
                                      : `Sisa ${sisa} hari ini`
                                    : "Ready stock"
                                  : "Pre-order"}
                              </p>
                            </div>

                            {qty === 0 ? (
                              <button
                                onClick={() => setQty(variant.id, 1)}
                                disabled={habis}
                                className="inline-flex shrink-0 items-center gap-2 border border-brand-dark bg-brand-dark px-4 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark disabled:cursor-not-allowed disabled:border-brand-border disabled:bg-transparent disabled:text-brand-muted"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Tambah
                              </button>
                            ) : (
                              <div className="flex shrink-0 items-center border border-brand-border bg-brand-bg">
                                <button
                                  onClick={() => setQty(variant.id, qty - 1)}
                                  aria-label="Kurangi"
                                  className="px-3 py-2.5 text-brand-text transition-colors hover:text-brand-dark"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-8 text-center font-mono text-xs font-semibold text-brand-dark">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => setQty(variant.id, qty + 1)}
                                  disabled={qty >= limit}
                                  aria-label="Tambah"
                                  className="px-3 py-2.5 text-brand-text transition-colors hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ringkasan + form */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-brand-border bg-brand-card">
              <div className="border-b border-brand-border px-5 py-4">
                <h2 className="flex items-center gap-2 font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                  <ShoppingBag className="h-4 w-4" />
                  Pesananmu
                  {cartCount > 0 && (
                    <span className="ml-auto font-mono text-xs text-brand-text">
                      {cartCount} item
                    </span>
                  )}
                </h2>
              </div>

              <div className="px-5 py-5">
                {cartItems.length === 0 ? (
                  <p className="py-6 text-center font-sans text-[11px] text-brand-text">
                    Belum ada item — pilih dari katalog.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {cartItems.map((item) => (
                      <div
                        key={item.variant.id}
                        className="flex items-start justify-between gap-3 font-sans text-[11px]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-brand-dark">
                            {item.product.name}
                          </p>
                          <p className="text-brand-text">
                            {item.variant.name} × {item.quantity}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-brand-dark">
                          {item.variant.priceAmount === null
                            ? "—"
                            : formatRupiah(item.variant.priceAmount * item.quantity)}
                        </span>
                      </div>
                    ))}

                    <div className="flex items-center justify-between border-t border-brand-border pt-3 font-sans text-xs">
                      <span className="uppercase tracking-[0.18em] text-brand-text">
                        Estimasi
                      </span>
                      <span className="font-mono text-sm font-bold text-brand-dark">
                        {hasUnpriced ? "Dikonfirmasi admin" : formatRupiah(total)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-4">
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

                  {error && (
                    <div className="border border-red-500 bg-red-50 px-4 py-3 font-sans text-[11px] font-semibold text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={isPending || cartItems.length === 0 || shortage}
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
