"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
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
import {
  canFulfillFromStock,
  minimumPreOrderDate,
} from "@/lib/order-types";
import {
  productImageSrc,
  type CatalogProduct,
  type CatalogVariant,
} from "@/lib/catalog-types";
import {
  getContactSnapshot,
  parseContactSnapshot,
  saveContact,
} from "@/lib/contact-store";
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

/// Kontak tidak berubah dari luar komponen — subscribe no-op cukup.
const noopSubscribe = () => () => {};

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
  const minimumPreorderDate = minimumPreOrderDate(
    new Date(`${today}T00:00:00+07:00`),
  );
  const [fulfillmentChoice, setFulfillmentChoice] = useState<
    "STOCK" | "PRE_ORDER"
  >("STOCK");
  const [preorderDate, setPreorderDate] = useState(minimumPreorderDate);

  // Keranjang = external store (localStorage) — React resinkron otomatis,
  // server snapshot kosong supaya hydration aman.
  const cartSnapshot = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    () => "",
  );
  const cart = useMemo(() => parseCartSnapshot(cartSnapshot), [cartSnapshot]);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showCheckoutShortcut, setShowCheckoutShortcut] = useState(false);
  const customerInfoRef = useRef<HTMLDivElement>(null);

  // Kontak terakhir tersimpan di localStorage — prefill nama & HP begitu ada.
  const contactSnapshot = useSyncExternalStore(
    noopSubscribe,
    getContactSnapshot,
    () => "",
  );
  const savedContact = useMemo(
    () => parseContactSnapshot(contactSnapshot),
    [contactSnapshot],
  );
  const effectiveName = customerName || savedContact?.name || "";
  const effectivePhone = phone || savedContact?.phone || "";

  const variantIndex = useMemo(() => {
    const map = new Map<
      string,
      { product: CatalogProduct; variant: CatalogVariant }
    >();

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
        return found
          ? { variant: found.variant, product: found.product, quantity }
          : null;
      })
      .filter((row): row is CartRow => row !== null);
  }, [cart, variantIndex]);

  const unavailableCount = useMemo(
    () =>
      Object.keys(cart).filter((variantId) => !variantIndex.has(variantId))
        .length,
    [cart, variantIndex],
  );

  const canUseStockToday = canFulfillFromStock(
    rows.map((row) => ({
      variantId: row.variant.id,
      quantity: row.quantity,
    })),
    stock,
  );

  const effectiveFulfillmentChoice =
    rows.length === 0 || !canUseStockToday
      ? "PRE_ORDER"
      : fulfillmentChoice;
  const isPickupToday = effectiveFulfillmentChoice === "STOCK";
  const scheduledAt = isPickupToday ? today : preorderDate;

  const total = rows.reduce(
    (acc, row) => acc + (row.variant.priceAmount ?? 0) * row.quantity,
    0,
  );
  const hasUnpriced = rows.some((row) => row.variant.priceAmount === null);

  useEffect(() => {
    const customerInfo = customerInfoRef.current;
    if (!customerInfo) return;

    const updateShortcutVisibility = () => {
      setShowCheckoutShortcut(
        customerInfo.getBoundingClientRect().top > window.innerHeight,
      );
    };

    updateShortcutVisibility();
    window.addEventListener("scroll", updateShortcutVisibility, {
      passive: true,
    });
    window.addEventListener("resize", updateShortcutVisibility);

    return () => {
      window.removeEventListener("scroll", updateShortcutVisibility);
      window.removeEventListener("resize", updateShortcutVisibility);
    };
  }, [cartSnapshot]);

  const handleSubmit = () => {
    setError(null);

    if (rows.length === 0) {
      setError("Keranjang masih kosong.");
      return;
    }

    if (!effectiveName.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    if (effectivePhone.replace(/\D/g, "").length < 9) {
      setError("Nomor HP tidak valid. Contoh: 08123456789.");
      return;
    }

    if (effectiveFulfillmentChoice === "STOCK" && !canUseStockToday) {
      setFulfillmentChoice("PRE_ORDER");
      setError(
        "Stok hari ini tidak terpenuhi. Pesanan dialihkan ke pre-order.",
      );
      return;
    }

    if (
      effectiveFulfillmentChoice === "PRE_ORDER" &&
      preorderDate < minimumPreorderDate
    ) {
      setPreorderDate(minimumPreorderDate);
      setError(
        `Tanggal pre-order paling cepat ${formatTanggal(minimumPreorderDate)} (H+3 WIB).`,
      );
      return;
    }

    startTransition(async () => {
      const result = await submitWebOrder({
        customerName: effectiveName,
        phone: effectivePhone,
        note,
        scheduledAt,
        items: rows.map((row) => ({
          variantId: row.variant.id,
          quantity: row.quantity,
        })),
      });

      if (!result.ok) {
        if (result.error.includes("Tanggal pre-order paling cepat")) {
          setFulfillmentChoice("PRE_ORDER");
          setPreorderDate(minimumPreOrderDate());
        }
        setError(result.error);
        return;
      }

      clearCart();
      saveContact(effectiveName, effectivePhone);
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
                <span className="float-right text-brand-dark">
                  {effectiveName}
                </span>
              </p>
              <p>
                <span className="uppercase tracking-[0.18em]">Ambil pada</span>{" "}
                <span className="float-right text-brand-dark">
                  {formatTanggal(scheduledAt)}
                </span>
              </p>
              <p>
                <span className="uppercase tracking-[0.18em]">Metode</span>{" "}
                <span className="float-right text-brand-dark">Pickup</span>
              </p>
              <p>
                <span className="uppercase tracking-[0.18em]">Pembayaran</span>{" "}
                <span className="float-right text-brand-dark">
                  Saat pengambilan
                </span>
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
    <section
      className={`relative bg-brand-bg py-24 md:py-32 ${
        showCheckoutShortcut && rows.length > 0
          ? "pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-32"
          : ""
      }`}
    >
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
            Periksa keranjang, isi nama dan nomor HP, lalu ambil langsung sesuai
            tanggal yang dipilih. Pembayaran saat pengambilan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ── Isi keranjang ── */}
          <div>
            <div className="mb-8 border border-brand-border bg-brand-card p-5 md:p-6">
              <h2 className={labelClass}>Cara Pemenuhan</h2>

              {fulfillmentChoice === "STOCK" &&
                !canUseStockToday &&
                rows.length > 0 && (
                  <div className="border border-red-500 bg-red-50/60 p-4 font-sans text-[11px] leading-relaxed text-red-700">
                    Stok hari ini tidak terpenuhi — Pesanan otomatis dialihkan
                    ke pre-order.
                  </div>
                )}
              <div className="space-y-3">
                <label
                  className={`flex cursor-pointer items-start gap-3 border p-4 ${
                    effectiveFulfillmentChoice === "STOCK"
                      ? "border-brand-dark bg-brand-bg"
                      : "border-brand-border"
                  } ${!canUseStockToday ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    value="STOCK"
                    checked={effectiveFulfillmentChoice === "STOCK"}
                    disabled={!canUseStockToday}
                    onChange={() => setFulfillmentChoice("STOCK")}
                    className="mt-0.5 accent-brand-dark"
                  />
                  <span>
                    <span className="block font-sans text-xs font-semibold text-brand-dark">
                      Ambil hari ini
                    </span>
                    <span className="mt-1 block font-sans text-[10px] leading-relaxed text-brand-text">
                      {canUseStockToday
                        ? "Stok cukup untuk seluruh keranjang."
                        : "Tidak tersedia karena stok seluruh keranjang belum mencukupi."}
                    </span>
                  </span>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 border p-4 ${
                    effectiveFulfillmentChoice === "PRE_ORDER"
                      ? "border-brand-dark bg-brand-bg"
                      : "border-brand-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="fulfillment"
                    value="PRE_ORDER"
                    checked={effectiveFulfillmentChoice === "PRE_ORDER"}
                    onChange={() => setFulfillmentChoice("PRE_ORDER")}
                    className="mt-0.5 accent-brand-dark"
                  />
                  <span>
                    <span className="block font-sans text-xs font-semibold text-brand-dark">
                      Pre-order
                    </span>
                    <span className="mt-1 block font-sans text-[10px] leading-relaxed text-brand-text">
                      Semua item dibuat sesuai tanggal pilihan; stok jadi tidak
                      direservasi.
                    </span>
                  </span>
                </label>
              </div>

              {isPickupToday ? (
                <p className="mt-3 font-sans text-[11px] text-brand-text">
                  Tanggal ambil: <strong>{formatTanggal(today)}</strong>
                </p>
              ) : (
                <div className="mt-4">
                  <label htmlFor="tanggal" className={labelClass}>
                    Tanggal Ambil Pre-order
                  </label>
                  <input
                    id="tanggal"
                    type="date"
                    min={minimumPreorderDate}
                    value={preorderDate}
                    onChange={(event) =>
                      setPreorderDate(event.target.value || minimumPreorderDate)
                    }
                    className="w-full border border-brand-border bg-brand-bg px-4 py-3 font-sans text-xs text-brand-dark outline-none focus:border-brand-dark sm:max-w-xs"
                  />
                  <p className="mt-3 font-sans text-[11px] leading-relaxed text-brand-text">
                    Paling cepat {formatTanggal(minimumPreorderDate)} (H+3 WIB).
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-brand-text">
                Isi Keranjang
              </h2>
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 border border-brand-border bg-brand-card px-3.5 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-dark transition-colors hover:border-brand-dark"
              >
                <Plus size={12} />
                Tambah Produk
              </button>
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
                  const sisa = stock[variant.id] ?? 0;

                  return (
                    <div
                      key={variant.id}
                      className="border border-brand-border bg-brand-card p-4 md:p-5"
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className="h-16 w-16 shrink-0 border border-brand-border bg-brand-bg bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${productImageSrc(variant.image || product.image)})`,
                          }}
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
                                onClick={() =>
                                  setCartQty(variant.id, quantity - 1)
                                }
                                aria-label="Kurangi"
                                className="px-3 py-2 text-brand-text transition-colors hover:text-brand-dark"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-8 text-center font-mono text-xs font-semibold text-brand-dark">
                                {quantity}
                              </span>
                              <button
                                onClick={() =>
                                  setCartQty(variant.id, quantity + 1)
                                }
                                disabled={quantity >= MAX_WEB_QTY}
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
                                  : formatRupiah(
                                      variant.priceAmount * quantity,
                                    )}
                              </p>
                              <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-text">
                                {isPickupToday
                                  ? `Stok hari ini · sisa ${sisa}`
                                  : `Pre-order untuk ${formatTanggal(scheduledAt)}`}
                              </p>
                            </div>
                          </div>

                          {fulfillmentChoice === "STOCK" &&
                            sisa > 0 &&
                            quantity > sisa && (
                            <p className="mt-2 border border-red-500 bg-red-50/60 px-3 py-1.5 font-sans text-[9px] font-semibold uppercase tracking-[0.14em] text-red-700">
                              Melebihi stok hari ini — kurang {quantity - sisa}
                            </p>
                          )}
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

              </div>
            )}
          </div>

          {/* ── Data pemesan + submit ── */}
          <div
            id="customer-info"
            ref={customerInfoRef}
            tabIndex={-1}
            className="scroll-mt-6 lg:sticky lg:top-24 lg:self-start"
          >
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
                      value={effectiveName}
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
                      value={effectivePhone}
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
                      placeholder="Contoh: ambil sore"
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
                    disabled={isPending || rows.length === 0}
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
                    · Pickup ({formatTanggal(scheduledAt)}) · Bayar saat pickup
                  </p>
                </div>
              </div>
            </div>
          </div>

          {showAdd && (
            <AddProductSheet
              products={products}
              stock={stock}
              onClose={() => setShowAdd(false)}
            />
          )}
        </div>
      </div>

      {showCheckoutShortcut && !showAdd && rows.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-brand-bg/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_24px_rgba(28,27,25,0.08)] backdrop-blur-sm lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-text">
                {cartTotalQty(cart)} item
              </p>
              <p className="truncate font-playfair text-lg font-bold text-brand-dark">
                {hasUnpriced ? "Dikonfirmasi admin" : formatRupiah(total)}
              </p>
            </div>
            <a
              href="#customer-info"
              aria-controls="customer-info"
              className="flex shrink-0 items-center justify-center gap-2 border border-brand-dark bg-brand-dark px-4 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
            >
              Data Pemesan
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

/// Bottom sheet picker: tambah varian lain langsung dari halaman checkout
/// tanpa pindah ke detail produk. Stepper menulis langsung ke cart store —
/// badge navbar & daftar keranjang ter-update live.
function AddProductSheet({
  products,
  stock,
  onClose,
}: {
  products: CatalogProduct[];
  stock: Record<string, number>;
  onClose: () => void;
}) {
  const snapshot = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    () => "",
  );
  const cart = useMemo(() => parseCartSnapshot(snapshot), [snapshot]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-dark/40 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto border border-brand-border bg-brand-bg sm:max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-brand-border bg-brand-bg px-5 py-4">
          <h3 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
            Tambah Produk
          </h3>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 text-brand-text transition-colors hover:text-brand-dark"
          >
            ✕
          </button>
        </div>

        {/* Daftar produk */}
        <div>
          {products.length === 0 && (
            <p className="px-5 py-10 text-center font-sans text-[11px] text-brand-text">
              Belum ada produk yang bisa dipesan online.
            </p>
          )}

          {products.map((product) => (
            <div
              key={product.id}
              className="border-b border-brand-border last:border-b-0"
            >
              <div className="flex items-center gap-3 border-b border-brand-border bg-brand-card px-4 py-3">
                <span
                  className="h-10 w-10 shrink-0 border border-brand-border bg-brand-bg bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${productImageSrc(product.image)})`,
                  }}
                />
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-dark">
                  {product.name}
                </p>
              </div>

              <div className="divide-y divide-brand-border">
                {product.variants.map((variant) => {
                  const qty = cart[variant.id] ?? 0;
                  const sisa = stock[variant.id] ?? 0;

                  return (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-sans text-xs font-semibold text-brand-dark">
                          {variant.name}
                        </p>
                        <p className="font-mono text-[10px] text-brand-text">
                          {variant.price ?? "Harga menyusul"}
                          {sisa > 0
                            ? ` · stok hari ini ${sisa}`
                            : " · pre-order tersedia"}
                        </p>
                      </div>

                      {qty === 0 ? (
                        <button
                          onClick={() => setCartQty(variant.id, 1)}
                          className="shrink-0 border border-brand-dark bg-brand-dark px-3.5 py-2 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark disabled:cursor-not-allowed disabled:border-brand-border disabled:bg-transparent disabled:text-brand-muted"
                        >
                          Tambah
                        </button>
                      ) : (
                        <div className="flex shrink-0 items-center border border-brand-border bg-brand-card">
                          <button
                            onClick={() => setCartQty(variant.id, qty - 1)}
                            aria-label="Kurangi"
                            className="px-2.5 py-2 text-brand-text transition-colors hover:text-brand-dark"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center font-mono text-xs font-semibold text-brand-dark">
                            {qty}
                          </span>
                          <button
                            onClick={() => setCartQty(variant.id, qty + 1)}
                            disabled={qty >= MAX_WEB_QTY}
                            aria-label="Tambah"
                            className="px-2.5 py-2 text-brand-text transition-colors hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-brand-border bg-brand-bg px-5 py-4">
          <button
            onClick={onClose}
            className="w-full border border-brand-dark bg-brand-dark px-5 py-3.5 font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
          >
            Selesai
          </button>
          <p className="mt-2 text-center font-sans text-[10px] text-brand-text">
            Item langsung masuk keranjang.
          </p>
        </div>
      </div>
    </div>
  );
}
