import Image from "next/image";
import { products } from "@/lib/products";

export default function ProductOverviewTable() {
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
          <span className="h-1.5 w-1.5 bg-brand-muted" />
          Read-only
        </span>
      </div>

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
            {products.map((product, index) => {
              const variantCount = product.variants?.length ?? 0;
              const startingPrice = product.variants?.[0]?.price ?? "By request";

              return (
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
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-playfair text-sm font-bold tracking-wide text-brand-dark">
                          {product.name}
                        </p>
                        <p className="mt-0.5 truncate font-sans text-[9px] uppercase tracking-[0.18em] text-brand-text">
                          {product.tagline}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 align-middle font-sans text-[11px] text-brand-text">
                    {product.hasVariants ? (
                      <span>
                        <b className="font-semibold text-brand-dark">
                          {variantCount}
                        </b>{" "}
                        varian
                      </span>
                    ) : (
                      <span className="uppercase tracking-[0.15em]">Custom</span>
                    )}
                  </td>

                  <td className="px-6 py-4 align-middle font-sans text-[11px] text-brand-text">
                    {startingPrice}
                  </td>

                  <td className="px-6 py-4 align-middle">
                    <span
                      className={`inline-flex items-center gap-2 border px-2.5 py-1 font-sans text-[8px] font-bold uppercase tracking-[0.18em] ${
                        product.hasVariants
                          ? "border-brand-border bg-brand-card text-brand-dark"
                          : "border-brand-dark bg-brand-dark text-brand-bg"
                      }`}
                    >
                      {product.hasVariants ? "Aktif" : "Custom"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-brand-border px-6 py-3">
        <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-brand-muted">
          Sumber data:{" "}
          <span className="font-mono text-brand-text">lib/products.ts</span>
        </p>
      </div>
    </section>
  );
}
