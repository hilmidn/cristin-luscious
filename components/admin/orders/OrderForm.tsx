"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { saveOrder } from "@/app/admin/(panel)/orders/actions";
import { formatPrice } from "@/lib/catalog-types";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  SERVICE_LABELS,
  SERVICE_TYPES,
  calculateOrderTotals,
  formatRupiah,
  type AdminOrder,
  type OrderInput,
  type OrderSourceOption,
  type OrderStatus,
  type OrderableProduct,
  type ServiceType,
} from "@/lib/order-types";

type OrderFormProps = {
  order?: AdminOrder;
  catalog: OrderableProduct[];
  sources: OrderSourceOption[];
};

type ItemDraft = {
  key: string;
  /** "v:<variantId>" | "p:<productId>" | "x:<itemId>" (katalog hilang) */
  selection: string;
  productName: string;
  variantName: string;
  unitPrice: string;
  priceUnit: string;
  quantity: string;
};

type CatalogEntry = {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string;
  unitPrice: number | null;
  priceUnit: string | null;
  manualPrice: boolean;
};

const inputClass =
  "w-full border border-brand-border bg-brand-bg px-3.5 py-3 font-sans text-xs text-brand-dark outline-none transition-colors placeholder:text-brand-muted focus:border-brand-dark disabled:cursor-not-allowed disabled:opacity-60";

const labelClass =
  "mb-2 block font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-brand-text";

function newKey() {
  return Math.random().toString(36).slice(2, 10);
}

function toNumber(value: string, fallback: number | null) {
  const trimmed = value.trim();

  if (trimmed === "") return fallback;

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function findCatalogEntry(
  catalog: OrderableProduct[],
  selection: string,
): CatalogEntry | null {
  const [type, id] = selection.split(":");

  if (!id) return null;

  if (type === "v") {
    for (const product of catalog) {
      const variant = product.variants.find((item) => item.id === id);

      if (variant) {
        return {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          unitPrice: variant.price,
          priceUnit: variant.priceUnit,
          manualPrice: false,
        };
      }
    }
  }

  if (type === "p") {
    const product = catalog.find((item) => item.id === id);

    if (product) {
      return {
        productId: product.id,
        variantId: null,
        productName: product.name,
        variantName: "Custom",
        unitPrice: null,
        priceUnit: null,
        manualPrice: true,
      };
    }
  }

  return null;
}

function toDrafts(order?: AdminOrder): ItemDraft[] {
  if (!order) return [];

  return order.items.map((item) => ({
    key: item.id,
    selection: item.variantId
      ? `v:${item.variantId}`
      : item.productId
        ? `p:${item.productId}`
        : `x:${item.id}`,
    productName: item.productName,
    variantName: item.variantName,
    unitPrice: item.unitPrice === null ? "" : String(item.unitPrice),
    priceUnit: item.priceUnit ?? "",
    quantity: String(item.quantity),
  }));
}

export default function OrderForm({ order, catalog, sources }: OrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState(order?.customerName ?? "");
  const [phone, setPhone] = useState(order?.phone ?? "");
  const [address, setAddress] = useState(order?.address ?? "");
  const [serviceType, setServiceType] = useState<ServiceType>(
    order?.serviceType ?? "PICKUP",
  );
  const [deliveryPoint, setDeliveryPoint] = useState(
    order?.deliveryPoint ?? "",
  );
  const [deliveryMapUrl, setDeliveryMapUrl] = useState(
    order?.deliveryMapUrl ?? "",
  );
  const [source, setSource] = useState(order?.source ?? "");
  const [note, setNote] = useState(order?.note ?? "");
  const [shippingCost, setShippingCost] = useState(
    String(order?.shippingCost ?? 0),
  );
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "BARU");
  const [items, setItems] = useState<ItemDraft[]>(() => toDrafts(order));

  const isDelivery = serviceType === "ANTAR";

  const previewTotals = calculateOrderTotals(
    items.map((item) => ({
      unitPrice: toNumber(item.unitPrice, null),
      quantity: toNumber(item.quantity, 0) ?? 0,
    })),
    isDelivery ? (toNumber(shippingCost, 0) ?? 0) : 0,
  );

  const hasUnpricedItem = items.some(
    (item) => toNumber(item.unitPrice, null) === null,
  );

  function updateItem(key: string, patch: Partial<ItemDraft>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function handleSelectionChange(key: string, selection: string) {
    const entry = findCatalogEntry(catalog, selection);

    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              selection,
              productName: entry?.productName ?? item.productName,
              variantName: entry?.variantName ?? item.variantName,
              unitPrice:
                entry === null
                  ? ""
                  : entry.unitPrice === null
                    ? ""
                    : String(entry.unitPrice),
              priceUnit: entry?.priceUnit ?? "",
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        key: newKey(),
        selection: "",
        productName: "",
        variantName: "",
        unitPrice: "",
        priceUnit: "",
        quantity: "1",
      },
    ]);
  }

  function handleServiceTypeChange(next: ServiceType) {
    setServiceType(next);

    if (next === "PICKUP") {
      setDeliveryPoint("");
      setDeliveryMapUrl("");
      setShippingCost("0");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const input: OrderInput = {
      id: order?.id,
      customerName,
      phone,
      address,
      serviceType,
      deliveryPoint: isDelivery ? deliveryPoint : null,
      deliveryMapUrl: isDelivery ? deliveryMapUrl.trim() || null : null,
      source: source.trim() || null,
      note: note.trim() || null,
      shippingCost: isDelivery ? (toNumber(shippingCost, 0) ?? 0) : 0,
      status,
      items: items.map((item, index) => {
        const entry = findCatalogEntry(catalog, item.selection);

        return {
          variantId: entry?.variantId ?? null,
          productId: entry?.productId ?? null,
          productName: item.productName,
          variantName: item.variantName,
          unitPrice: toNumber(item.unitPrice, null),
          priceUnit: item.priceUnit.trim() || null,
          quantity: toNumber(item.quantity, 0) ?? 0,
          sortOrder: index,
        };
      }),
    };

    startTransition(async () => {
      const result = await saveOrder(input);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push("/admin/orders");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-brand-dark bg-brand-card px-4 py-3"
        >
          <AlertCircle size={15} strokeWidth={1.6} className="mt-0.5 shrink-0" />
          <p className="font-sans text-[11px] leading-relaxed text-brand-dark">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          {/* Data pemesan */}
          <section className="border border-brand-border bg-brand-card/40 p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-brand-border pb-4">
              <div>
                <h2 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                  Data Pemesan
                </h2>
                <p className="mt-1 font-sans text-[10px] text-brand-text">
                  Kontak dan alamat yang dipakai untuk pengiriman atau pickup.
                </p>
              </div>
              <span className="font-mono text-[9px] text-brand-muted">01</span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="customerName" className={labelClass}>
                  Nama Pemesan
                </label>
                <input
                  id="customerName"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  required
                  placeholder="Nama penerima"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  No. HP
                </label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  inputMode="tel"
                  placeholder="08123456789"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className={labelClass}>
                  Alamat
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  required
                  rows={3}
                  placeholder="Alamat lengkap pengiriman atau catatan pickup"
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </div>

              <div>
                <label htmlFor="serviceType" className={labelClass}>
                  Jenis Layanan
                </label>
                <select
                  id="serviceType"
                  value={serviceType}
                  onChange={(event) =>
                    handleServiceTypeChange(event.target.value as ServiceType)
                  }
                  className={inputClass}
                >
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {SERVICE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="source" className={labelClass}>
                  Sumber{" "}
                  <span className="font-normal tracking-normal text-brand-muted">
                    (opsional)
                  </span>
                </label>
                <input
                  id="source"
                  list="order-source-options"
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  placeholder="Instagram, WhatsApp, repeat order..."
                  className={inputClass}
                />
                <datalist id="order-source-options">
                  {sources.map((option) => (
                    <option key={option.source} value={option.source}>
                      {option.count} pesanan
                    </option>
                  ))}
                </datalist>
                <p className="mt-1.5 font-sans text-[9px] text-brand-muted">
                  Pilihan diambil otomatis dari pesanan sebelumnya.
                </p>
              </div>

              {isDelivery && (
                <>
                  <div className="sm:col-span-2">
                    <label htmlFor="deliveryPoint" className={labelClass}>
                      Titik Lokasi Pengantaran
                    </label>
                    <textarea
                      id="deliveryPoint"
                      value={deliveryPoint}
                      onChange={(event) => setDeliveryPoint(event.target.value)}
                      required
                      rows={2}
                      placeholder="Patokan / detail lokasi, mis. dekat Alun-alun Wonosobo, rumah cat biru"
                      className={`${inputClass} resize-y leading-relaxed`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="deliveryMapUrl" className={labelClass}>
                      Link Google Maps{" "}
                      <span className="font-normal tracking-normal text-brand-muted">
                        (opsional)
                      </span>
                    </label>
                    <input
                      id="deliveryMapUrl"
                      value={deliveryMapUrl}
                      onChange={(event) =>
                        setDeliveryMapUrl(event.target.value)
                      }
                      placeholder="https://maps.app.goo.gl/..."
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label htmlFor="note" className={labelClass}>
                  Catatan{" "}
                  <span className="font-normal tracking-normal text-brand-muted">
                    (opsional)
                  </span>
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  placeholder="Permintaan khusus, tanggal ambil, dsb."
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </div>
            </div>
          </section>

          {/* Item pesanan */}
          <section className="border border-brand-border bg-brand-card/40 p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 border-b border-brand-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                  Item Pesanan
                </h2>
                <p className="mt-1 font-sans text-[10px] text-brand-text">
                  Satu pesanan bisa berisi beberapa varian sekaligus.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex w-fit items-center gap-2 border border-brand-dark bg-brand-dark px-4 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
              >
                <Plus size={13} />
                Tambah Item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="border border-dashed border-brand-border bg-brand-bg px-5 py-10 text-center">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-dark">
                  Belum ada item
                </p>
                <p className="mx-auto mt-2 max-w-sm font-sans text-[10px] leading-relaxed text-brand-text">
                  Pilih produk dan varian yang dipesan. Produk tanpa varian
                  tampil sebagai custom order dengan harga manual.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => {
                  const entry = findCatalogEntry(catalog, item.selection);
                  const manualPrice =
                    !entry || entry.manualPrice || item.selection === "";
                  const lineTotal =
                    (toNumber(item.unitPrice, null) ?? 0) *
                    (toNumber(item.quantity, 0) ?? 0);

                  return (
                    <div
                      key={item.key}
                      className="border border-brand-border bg-brand-bg"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-brand-border bg-brand-card px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[9px] text-brand-muted">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-brand-dark">
                            {item.productName && item.variantName
                              ? `${item.productName} — ${item.variantName}`
                              : "Item baru"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setItems((current) =>
                              current.filter((row) => row.key !== item.key),
                            )
                          }
                          aria-label="Hapus item"
                          className="p-1.5 text-brand-text transition-colors hover:text-brand-dark"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_110px_180px]">
                        <div>
                          <label className={labelClass}>Produk &amp; Varian</label>
                          <select
                            value={item.selection}
                            onChange={(event) =>
                              handleSelectionChange(
                                item.key,
                                event.target.value,
                              )
                            }
                            required
                            className={inputClass}
                          >
                            <option value="">Pilih varian…</option>
                            {catalog.map((product) =>
                              product.variants.length > 0 ? (
                                <optgroup
                                  key={product.id}
                                  label={product.name}
                                >
                                  {product.variants.map((variant) => (
                                    <option
                                      key={variant.id}
                                      value={`v:${variant.id}`}
                                    >
                                      {variant.name} —{" "}
                                      {formatPrice(
                                        variant.price,
                                        variant.priceUnit,
                                      ) ?? "harga menyusul"}
                                    </option>
                                  ))}
                                </optgroup>
                              ) : (
                                <option
                                  key={product.id}
                                  value={`p:${product.id}`}
                                >
                                  {product.name} — custom (harga manual)
                                </option>
                              ),
                            )}
                            {item.selection.startsWith("x:") && (
                              <option value={item.selection}>
                                {item.productName} — {item.variantName} (katalog
                                hilang)
                              </option>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className={labelClass}>Jumlah</label>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(item.key, {
                                quantity: event.target.value,
                              })
                            }
                            required
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>Harga Satuan</label>
                          {manualPrice ? (
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={item.unitPrice}
                              onChange={(event) =>
                                updateItem(item.key, {
                                  unitPrice: event.target.value,
                                })
                              }
                              placeholder="Kosongkan jika menyusul"
                              className={inputClass}
                            />
                          ) : (
                            <div className="flex h-[42px] items-center border border-brand-border bg-brand-card px-3.5 font-sans text-xs text-brand-dark">
                              {formatPrice(
                                toNumber(item.unitPrice, null),
                                item.priceUnit,
                              ) ?? "Harga menyusul"}
                            </div>
                          )}
                          <p className="mt-1.5 font-sans text-[9px] text-brand-muted">
                            Subtotal: {formatRupiah(lineTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar invoice */}
        <div className="space-y-8">
          <section className="border border-brand-border bg-brand-card/40 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-brand-border pb-4">
              <h2 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                Invoice
              </h2>
              <span className="font-mono text-[9px] text-brand-muted">02</span>
            </div>

            <div className="space-y-3 font-sans text-[10px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-brand-text">Kode</span>
                <span className="font-mono text-[11px] font-semibold text-brand-dark">
                  {order?.code ?? "Otomatis saat disimpan"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-brand-text">Jumlah item</span>
                <span className="font-semibold text-brand-dark">
                  {items.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-brand-border pt-3">
                <span className="text-brand-text">Subtotal</span>
                <span className="font-semibold text-brand-dark">
                  {formatRupiah(previewTotals.subtotal)}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="shippingCost" className={labelClass}>
                Ongkir (Rp)
              </label>
              <input
                id="shippingCost"
                type="number"
                min={0}
                step={1}
                value={isDelivery ? shippingCost : "0"}
                disabled={!isDelivery}
                onChange={(event) => setShippingCost(event.target.value)}
                className={inputClass}
              />
              <p className="mt-1.5 font-sans text-[9px] leading-relaxed text-brand-muted">
                {isDelivery
                  ? "Isi ongkir sesuai kesepakatan."
                  : "Layanan pickup tidak dikenakan ongkir."}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-brand-border pt-4">
              <span className="font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
                Total
              </span>
              <span className="font-playfair text-xl font-bold text-brand-dark">
                {formatRupiah(previewTotals.total)}
              </span>
            </div>

            {hasUnpricedItem && (
              <p className="mt-3 font-sans text-[9px] leading-relaxed text-brand-text">
                Ada item tanpa harga. Total belum termasuk item tersebut
                (harga menyusul).
              </p>
            )}
          </section>

          <section className="border border-brand-border bg-brand-card/40 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-brand-border pb-4">
              <h2 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                Status
              </h2>
              <span className="font-mono text-[9px] text-brand-muted">03</span>
            </div>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as OrderStatus)}
              className={inputClass}
            >
              {ORDER_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {ORDER_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-brand-bg/95 backdrop-blur-xl lg:left-72">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <Link
            href="/admin/orders"
            className="inline-flex items-center justify-center gap-2 border border-brand-border bg-brand-card px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark"
          >
            <ArrowLeft size={13} />
            Kembali
          </Link>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2.5 border border-brand-dark bg-brand-dark px-7 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.22em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {order ? "Simpan Perubahan" : "Buat Pesanan"}
          </button>
        </div>
      </div>
    </form>
  );
}
