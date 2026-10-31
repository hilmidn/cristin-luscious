import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageOff } from "lucide-react";
import { getAdminProducts } from "@/lib/catalog";

export default async function ProductOverviewTable() {
  const products = await getAdminProducts();
  const shown = products.slice(0, 6);

  return (
    <section className="border border-brand-border bg-brand-bg">
      <div className="flex flex-col gap-3 border-b border-brand-border px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.35em] text-brand-text">
            Katalog
          </span>
          <h2 className="mt-1 font-playfair text-xl font-bold uppercase tracking-tight text-brand-dark">
            Produk &amp; Varian
          </h2>
        </div>

        <span className="inline-flex w-fit items-center gap-2 border border-brand-border bg-brand-card px-2.5 py-1.5 font-sans text-[8px] font-bold uppercase tracking-[0.2em] text-brand-text">
          <span className="h-1.5 w-1.5 bg-brand-dark" />
          Live database
        </span>
      </div>

      {shown.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-playfair text-lg font-bold text-brand-dark">
            Katalog masih kosong
          </p>
          <p className="mx-auto mt-2 max-w-sm font-sans text-[10px] leading-relaxed text-brand-text">
            Tambahkan produk pertama untuk mulai mengisi website.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-5 inline-flex items-center gap-2 border border-brand-dark bg-brand-dark px-4 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
          >
            Tambah Produk
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-brand-border bg-brand-card">
                <th className="px-6 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
                  No.
                </th>
                <th className="px-6 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
                  Produk
                </th>
                <th className="px-6 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
                  Varian
                </th>
                <th className="px-6 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
                  Harga Mulai
                </th>
                <th className="px-6 py-3 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-brand-text">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {shown.map((product, index) => (
                <tr
                  key={product.id}
                  className="border-b border-brand-border/70 transition-colors last:border-b-0 hover:bg-brand-card/60"
                >
                  <td className="px-6 py-4 align-middle font-mono text-[10px] text-brand-muted">
                    {String(index + 1).padStart(2, "0")}
                  </td>

                  <td className="px-6 py-4 align-middle">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-brand-border bg-brand-card">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-brand-muted">
                            <ImageOff size={15} />
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
                        <p className="mt-0.5 truncate font-sans text-[9px] uppercase tracking-[0.18em] text-brand-text">
                          {product.tagline}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 align-middle font-sans text-[11px] text-brand-text">
                    {product.variantCount > 0 ? (
                      <span>
                        <b className="font-semibold text-brand-dark">
                          {product.variantCount}
                        </b>{" "}
                        varian
                      </span>
                    ) : (
                      <span className="uppercase tracking-[0.15em]">Custom</span>
                    )}
                  </td>

                  <td className="px-6 py-4 align-middle font-sans text-[11px] text-brand-text">
                    {product.startingPrice ?? "By request"}
                  </td>

                  <td className="px-6 py-4 align-middle">
                    <span
                      className={`inline-flex items-center gap-2 border px-2.5 py-1 font-sans text-[8px] font-bold uppercase tracking-[0.18em] ${
                        product.published
                          ? "border-brand-border bg-brand-card text-brand-dark"
                          : "border-brand-dark bg-brand-dark text-brand-bg"
                      }`}
                    >
                      {product.published ? "Aktif" : "Draft"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-brand-border px-6 py-3">
        <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-brand-muted">
          Sumber data:{" "}
          <span className="font-mono text-brand-text">PostgreSQL</span>
        </p>

        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-text transition-colors hover:text-brand-dark"
        >
          Kelola semua
          <ArrowRight size={12} />
        </Link>
      </div>
    </section>
  );
}
