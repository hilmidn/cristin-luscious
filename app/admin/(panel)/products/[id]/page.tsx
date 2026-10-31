import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import PageHeading from "@/components/admin/PageHeading";
import DeleteProductButton from "@/components/admin/products/DeleteProductButton";
import ProductForm from "@/components/admin/products/ProductForm";
import { getAdminProductById } from "@/lib/catalog";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getAdminProductById(id);

  return {
    title: product ? `Edit ${product.name}` : "Edit Produk",
  };
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getAdminProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <>
      <PageHeading
        eyebrow="Katalog"
        title={product.name}
        accent="edit"
        description={`Slug publik: /products/${product.slug} • ${product.variants.length} varian`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {product.published && (
              <Link
                href={`/products/${product.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-brand-border bg-brand-card px-4 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark"
              >
                Lihat Halaman
                <ArrowUpRight size={12} />
              </Link>
            )}

            <DeleteProductButton id={product.id} name={product.name} />
          </div>
        }
      />

      <ProductForm product={product} />
    </>
  );
}
