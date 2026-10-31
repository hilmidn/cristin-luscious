import type { Metadata } from "next";
import PageHeading from "@/components/admin/PageHeading";
import ProductForm from "@/components/admin/products/ProductForm";

export const metadata: Metadata = {
  title: "Produk Baru",
};

export default function NewProductPage() {
  return (
    <>
      <PageHeading
        eyebrow="Katalog"
        title="Produk Baru"
        accent="tambah"
        description="Buat koleksi baru beserta variannya. Setelah disimpan dan dipublikasikan, produk langsung muncul di website."
      />

      <ProductForm />
    </>
  );
}
