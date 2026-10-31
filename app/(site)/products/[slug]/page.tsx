import {
  getPublishedProductBySlug,
  getPublishedProducts,
  getRelatedProducts,
} from "@/lib/catalog";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetailClient from "@/components/ProductDetailClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await getPublishedProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);

  if (!product) return {};

  return {
    title: `${product.name} | Cristin's Luscious`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product.slug);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark selection:bg-brand-dark selection:text-brand-bg">
      <Navbar />
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
      />
      <Footer />
    </div>
  );
}
