import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ImageOff, Plus } from "lucide-react";
import PageHeading from "@/components/admin/PageHeading";
import ProductStatusButton from "@/components/admin/products/ProductStatusButton";
import { getAdminProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Produk",
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();
  const publishedCount = products.filter((product) => product.published).length;

  return (
    <>
      <PageHeading
        eyebrow="Katalog"
        title="Produk"
        accent="& varian"
        description="Kelola koleksi Cristin Luscious: tambah produk, atur varian, unggah gambar, dan tentukan urutan tampil di website."
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 border border-brand-dark bg-brand-dark px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
          >
            <Plus size={14} />
            Tambah Produk
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Total Produk
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {products.length}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Aktif di Website
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {publishedCount}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Total Varian
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {products.reduce(
              (total, product) => total + product.variantCount,
              0,
            )}
          </p>
        </div>
      </div>

      <section className="border border-brand-border bg-brand-bg">
        <div className="flex items-end justify-between gap-4 border-b border-brand-border px-5 py-4 sm:px-6">
          <div>
            <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.35em] text-brand-text">
              Daftar Koleksi
            </span>
            <h2 className="mt-1 font-playfair text-xl font-bold uppercase tracking-tight text-brand-dark">
              Produk &amp; Varian
            </h2>
          </div>
          <span className="font-mono text-[9px] text-brand-muted">
            {String(products.length).padStart(2, "0")} item
          </span>
        </div>

        {products.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-playfair text-xl font-bold text-brand-dark">
              Belum ada produk
            </p>
            <p className="mx-auto mt-2 max-w-sm font-sans text-[11px] leading-relaxed text-brand-text">
              Mulai dengan menambahkan koleksi pertama. Produk yang dibuat di
              sini langsung tampil di website setelah dipublikasikan.
            </p>
            <Link
              href="/admin/products/new"
              className="mt-6 inline-flex items-center gap-2 border border-brand-dark bg-brand-dark px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
            >
              <Plus size={13} />
              Tambah Produk Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-brand-border bg-brand-card">
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    No.
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Produk
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Varian
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Harga Mulai
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Status
                  </th>
                  <th className="px-5 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Urutan
                  </th>
                  <th className="px-5 py-3 text-right font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text sm:px-6">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product, index) => (
                  <tr
                    key={product.id}
                    className="border-b border-brand-border/70 transition-colors last:border-b-0 hover:bg-brand-card/60"
                  >
                    <td className="px-5 py-4 align-middle font-mono text-[10px] text-brand-muted sm:px-6">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    <td className="px-5 py-4 align-middle sm:px-6">
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-brand-border bg-brand-card">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              unoptimized
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-brand-muted">
                              <ImageOff size={16} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="block truncate font-playfair text-sm font-bold tracking-wide text-brand-dark transition-colors hover:text-brand-text"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-0.5 max-w-[240px] truncate font-sans text-[9px] uppercase tracking-[0.16em] text-brand-text">
                            {product.tagline}
                          </p>
                          <p className="mt-1 max-w-[240px] truncate font-mono text-[9px] text-brand-muted">
                            /products/{product.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-middle font-sans text-[11px] text-brand-text sm:px-6">
                      {product.variantCount > 0 ? (
                        <span>
                          <b className="font-semibold text-brand-dark">
                            {product.publishedVariantCount}
                          </b>{" "}
                          / {product.variantCount} tampil
                        </span>
                      ) : (
                        <span className="font-semibold uppercase tracking-[0.14em] text-brand-dark">
                          Custom
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 align-middle font-sans text-[11px] text-brand-text sm:px-6">
                      {product.startingPrice ?? "By request"}
                    </td>

                    <td className="px-5 py-4 align-middle sm:px-6">
                      <ProductStatusButton
                        id={product.id}
                        published={product.published}
                      />
                    </td>

                    <td className="px-5 py-4 align-middle font-mono text-[10px] text-brand-text sm:px-6">
                      {String(product.sortOrder).padStart(2, "0")}
                    </td>

                    <td className="px-5 py-4 align-middle text-right sm:px-6">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="inline-flex items-center gap-2 border border-brand-border bg-brand-card px-3 py-2 font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-brand-dark transition-colors hover:border-brand-dark"
                      >
                        Edit
                        <ArrowUpRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 font-sans text-[9px] uppercase tracking-[0.18em] text-brand-muted">
        Perubahan disimpan ke database dan langsung memperbarui halaman publik.
      </p>
    </>
  );
}
