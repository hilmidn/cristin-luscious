"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import { saveProduct } from "@/app/admin/(panel)/products/actions";
import {
  parseTags,
  slugify,
  type AdminProduct,
  type ProductInput,
} from "@/lib/catalog-types";

type ProductFormProps = {
  product?: AdminProduct;
};

type VariantDraft = {
  key: string;
  id?: string;
  name: string;
  description: string;
  price: string;
  priceUnit: string;
  image: string;
  tags: string;
  published: boolean;
};

const inputClass =
  "w-full border border-brand-border bg-brand-bg px-3.5 py-3 font-sans text-xs text-brand-dark outline-none transition-colors placeholder:text-brand-muted focus:border-brand-dark";

const labelClass =
  "mb-2 block font-sans text-[9px] font-bold uppercase tracking-[0.28em] text-brand-text";

function newKey() {
  return Math.random().toString(36).slice(2, 10);
}

function toDraft(product?: AdminProduct): VariantDraft[] {
  if (!product) return [];

  return product.variants.map((variant) => ({
    key: variant.id,
    id: variant.id,
    name: variant.name,
    description: variant.description,
    price: variant.price === null ? "" : String(variant.price),
    priceUnit: variant.priceUnit ?? "",
    image: variant.image,
    tags: variant.tags.join(", "),
    published: variant.published,
  }));
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [image, setImage] = useState(product?.image ?? "");
  const [features, setFeatures] = useState(
    product?.features.join("\n") ?? "",
  );
  const [customNote, setCustomNote] = useState(product?.customNote ?? "");
  const [published, setPublished] = useState(product?.published ?? true);
  const [sortOrder, setSortOrder] = useState(String(product?.sortOrder ?? 0));
  const [variants, setVariants] = useState<VariantDraft[]>(() =>
    toDraft(product),
  );

  function updateVariant(key: string, patch: Partial<VariantDraft>) {
    setVariants((current) =>
      current.map((variant) =>
        variant.key === key ? { ...variant, ...patch } : variant,
      ),
    );
  }

  function moveVariant(index: number, direction: -1 | 1) {
    setVariants((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      {
        key: newKey(),
        name: "",
        description: "",
        price: "",
        priceUnit: "",
        image,
        tags: "",
        published: true,
      },
    ]);
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const input: ProductInput = {
      id: product?.id,
      name,
      slug,
      tagline,
      description,
      image,
      features: features
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean),
      customNote: customNote.trim() || null,
      published,
      sortOrder: sortOrder.trim() === "" ? 0 : Number(sortOrder),
      variants: variants.map((variant, index) => ({
        id: variant.id,
        name: variant.name,
        description: variant.description,
        price: variant.price.trim() === "" ? null : Number(variant.price),
        priceUnit: variant.priceUnit.trim() || null,
        image: variant.image,
        tags: parseTags(variant.tags),
        published: variant.published,
        sortOrder: index,
      })),
    };

    startTransition(async () => {
      const result = await saveProduct(input);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push("/admin/products");
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
        {/* Main fields */}
        <div className="space-y-8">
          <section className="border border-brand-border bg-brand-card/40 p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-brand-border pb-4">
              <div>
                <h2 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                  Informasi Produk
                </h2>
                <p className="mt-1 font-sans text-[10px] text-brand-text">
                  Nama koleksi dan cerita singkat yang tampil di website.
                </p>
              </div>
              <span className="font-mono text-[9px] text-brand-muted">01</span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Nama Produk
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  required
                  placeholder="Handcrafted Cookies"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="slug" className={labelClass}>
                  Slug URL
                </label>
                <div className="flex items-center border border-brand-border bg-brand-bg focus-within:border-brand-dark">
                  <span className="pl-3.5 font-mono text-[10px] text-brand-muted">
                    /products/
                  </span>
                  <input
                    id="slug"
                    value={slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setSlug(event.target.value);
                    }}
                    required
                    placeholder="handcrafted-cookies"
                    className="w-full bg-transparent px-1 py-3 font-sans text-xs text-brand-dark outline-none placeholder:text-brand-muted"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="tagline" className={labelClass}>
                  Tagline
                </label>
                <input
                  id="tagline"
                  value={tagline}
                  onChange={(event) => setTagline(event.target.value)}
                  required
                  placeholder="Crisp Edges, Chewy Core"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className={labelClass}>
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  rows={4}
                  placeholder="Ceritakan karakter produk ini..."
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="features" className={labelClass}>
                  Keunggulan
                </label>
                <textarea
                  id="features"
                  value={features}
                  onChange={(event) => setFeatures(event.target.value)}
                  rows={3}
                  placeholder={"Baked Fresh Daily\nNo Artificial Flavor\nPremium Ingredients"}
                  className={`${inputClass} resize-y leading-relaxed`}
                />
                <p className="mt-1.5 font-sans text-[9px] text-brand-muted">
                  Satu keunggulan per baris. Tampil sebagai label kecil di kartu
                  produk.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="customNote" className={labelClass}>
                  Catatan Custom Order{" "}
                  <span className="font-normal tracking-normal text-brand-muted">
                    (opsional)
                  </span>
                </label>
                <textarea
                  id="customNote"
                  value={customNote}
                  onChange={(event) => setCustomNote(event.target.value)}
                  rows={3}
                  placeholder="Tampil jika produk tidak punya varian, misalnya detail pemesanan custom cake."
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </div>
            </div>
          </section>

          {/* Variants */}
          <section className="border border-brand-border bg-brand-card/40 p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 border-b border-brand-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                  Varian
                </h2>
                <p className="mt-1 font-sans text-[10px] text-brand-text">
                  Rasa, ukuran, atau paket yang bisa dipesan. Urutan di sini
                  menentukan urutan di website.
                </p>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="inline-flex w-fit items-center gap-2 border border-brand-dark bg-brand-dark px-4 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
              >
                <Plus size={13} />
                Tambah Varian
              </button>
            </div>

            {variants.length === 0 ? (
              <div className="border border-dashed border-brand-border bg-brand-bg px-5 py-10 text-center">
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-dark">
                  Belum ada varian
                </p>
                <p className="mx-auto mt-2 max-w-sm font-sans text-[10px] leading-relaxed text-brand-text">
                  Produk tanpa varian akan tampil sebagai custom order. Gunakan
                  kolom catatan custom di atas untuk menjelaskan alur
                  pemesanannya.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div
                    key={variant.key}
                    className="border border-brand-border bg-brand-bg"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-brand-border bg-brand-card px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[9px] text-brand-muted">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-brand-dark">
                          {variant.name || "Varian baru"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveVariant(index, -1)}
                          disabled={index === 0}
                          aria-label="Naikkan varian"
                          className="p-1.5 text-brand-text transition-colors hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveVariant(index, 1)}
                          disabled={index === variants.length - 1}
                          aria-label="Turunkan varian"
                          className="p-1.5 text-brand-text transition-colors hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setVariants((current) =>
                              current.filter((item) => item.key !== variant.key),
                            )
                          }
                          aria-label="Hapus varian"
                          className="ml-1 p-1.5 text-brand-text transition-colors hover:text-brand-dark"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                      <ImageUploader
                        value={variant.image}
                        onChange={(value) =>
                          updateVariant(variant.key, { image: value })
                        }
                        label="Gambar Varian"
                        hint="Rasio persegi paling optimal."
                      />

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>Nama Varian</label>
                          <input
                            value={variant.name}
                            onChange={(event) =>
                              updateVariant(variant.key, {
                                name: event.target.value,
                              })
                            }
                            required
                            placeholder="Chocolate Chip Classic"
                            className={inputClass}
                          />
                        </div>

                        <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2">
                          <div>
                            <label className={labelClass}>Harga (Rp)</label>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={variant.price}
                              onChange={(event) =>
                                updateVariant(variant.key, {
                                  price: event.target.value,
                                })
                              }
                              placeholder="45000"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Satuan</label>
                            <input
                              value={variant.priceUnit}
                              onChange={(event) =>
                                updateVariant(variant.key, {
                                  priceUnit: event.target.value,
                                })
                              }
                              placeholder="6 pcs"
                              className={inputClass}
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className={labelClass}>Tag</label>
                          <input
                            value={variant.tags}
                            onChange={(event) =>
                              updateVariant(variant.key, {
                                tags: event.target.value,
                              })
                            }
                            placeholder="Best Seller, Chocolate, Classic"
                            className={inputClass}
                          />
                          <p className="mt-1.5 font-sans text-[9px] text-brand-muted">
                            Pisahkan dengan koma. Tag{" "}
                            <span className="font-mono">Best Seller</span> ikut
                            dihitung di dashboard.
                          </p>
                        </div>

                        <div className="sm:col-span-2">
                          <label className={labelClass}>Deskripsi Varian</label>
                          <textarea
                            value={variant.description}
                            onChange={(event) =>
                              updateVariant(variant.key, {
                                description: event.target.value,
                              })
                            }
                            required
                            rows={3}
                            placeholder="Rasa, tekstur, dan bahan utama varian ini..."
                            className={`${inputClass} resize-y leading-relaxed`}
                          />
                        </div>

                        <label className="flex cursor-pointer items-center gap-2.5 sm:col-span-2">
                          <input
                            type="checkbox"
                            checked={variant.published}
                            onChange={(event) =>
                              updateVariant(variant.key, {
                                published: event.target.checked,
                              })
                            }
                            className="h-3.5 w-3.5 accent-brand-dark"
                          />
                          <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-text">
                            Tampilkan varian ini di website
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <section className="border border-brand-border bg-brand-card/40 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-brand-border pb-4">
              <h2 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                Gambar Utama
              </h2>
              <span className="font-mono text-[9px] text-brand-muted">02</span>
            </div>

            <ImageUploader
              value={image}
              onChange={setImage}
              label="Foto Produk"
              hint="Gunakan foto persegi agar konsisten di kartu dan halaman detail."
            />
          </section>

          <section className="border border-brand-border bg-brand-card/40 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-brand-border pb-4">
              <h2 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
                Publikasi
              </h2>
              <span className="font-mono text-[9px] text-brand-muted">03</span>
            </div>

            <label className="flex cursor-pointer items-start gap-3 border border-brand-border bg-brand-bg p-3.5">
              <input
                type="checkbox"
                checked={published}
                onChange={(event) => setPublished(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-dark"
              />
              <span>
                <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-brand-dark">
                  Tampilkan produk
                </span>
                <span className="mt-1 block font-sans text-[9px] leading-relaxed text-brand-text">
                  Saat dimatikan, produk dan detailnya tidak bisa diakses
                  pengunjung.
                </span>
              </span>
            </label>

            <div className="mt-5">
              <label htmlFor="sortOrder" className={labelClass}>
                Urutan Tampil
              </label>
              <input
                id="sortOrder"
                type="number"
                step={1}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className={inputClass}
              />
              <p className="mt-1.5 font-sans text-[9px] leading-relaxed text-brand-muted">
                Angka kecil tampil lebih dulu. Contoh: 0, 1, 2.
              </p>
            </div>
          </section>

          <section className="border border-brand-border bg-brand-bg p-5">
            <p className="font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
              Ringkasan
            </p>
            <dl className="mt-4 space-y-3 font-sans text-[10px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-brand-text">Varian</dt>
                <dd className="font-semibold text-brand-dark">
                  {variants.length}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-brand-text">Varian tampil</dt>
                <dd className="font-semibold text-brand-dark">
                  {variants.filter((variant) => variant.published).length}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-brand-text">Status</dt>
                <dd className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em] text-brand-dark">
                  {published ? (
                    <>
                      <Check size={11} /> Aktif
                    </>
                  ) : (
                    "Draft"
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      {/* Sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-brand-bg/95 backdrop-blur-xl lg:left-72">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <Link
            href="/admin/products"
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
            {product ? "Simpan Perubahan" : "Buat Produk"}
          </button>
        </div>
      </div>
    </form>
  );
}
