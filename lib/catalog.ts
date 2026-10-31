import "server-only";

import { getPrisma } from "./prisma";
import {
  formatPrice,
  type AdminProduct,
  type AdminProductListItem,
  type CatalogProduct,
} from "./catalog-types";

type VariantRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number | null;
  priceUnit: string | null;
  image: string;
  tags: string[];
  published: boolean;
  sortOrder: number;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  features: string[];
  customNote: string | null;
  published: boolean;
  sortOrder: number;
  variants: VariantRow[];
};

function toCatalogProduct(product: ProductRow): CatalogProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    image: product.image,
    features: product.features,
    hasVariants: product.variants.length > 0,
    customNote: product.customNote ?? undefined,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      description: variant.description,
      price: formatPrice(variant.price, variant.priceUnit),
      image: variant.image,
      tags: variant.tags,
    })),
  };
}

const catalogInclude = {
  variants: {
    where: { published: true },
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
  },
};

export async function getPublishedProducts(): Promise<CatalogProduct[]> {
  const products = await getPrisma().product.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: catalogInclude,
  });

  return products.map(toCatalogProduct);
}

export async function getPublishedProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  const product = await getPrisma().product.findUnique({
    where: { slug },
    include: catalogInclude,
  });

  if (!product || !product.published) {
    return null;
  }

  return toCatalogProduct(product);
}

export async function getRelatedProducts(
  slug: string,
  limit = 4,
): Promise<CatalogProduct[]> {
  const products = await getPrisma().product.findMany({
    where: {
      published: true,
      slug: { not: slug },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: limit,
    include: catalogInclude,
  });

  return products.map(toCatalogProduct);
}

export async function getAdminProducts(): Promise<AdminProductListItem[]> {
  const products = await getPrisma().product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      variants: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          price: true,
          priceUnit: true,
          published: true,
        },
      },
    },
  });

  return products.map((product) => {
    const publishedVariants = product.variants.filter(
      (variant) => variant.published,
    );
    const pricedVariant = publishedVariants.find(
      (variant) => variant.price !== null,
    );

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      image: product.image,
      published: product.published,
      sortOrder: product.sortOrder,
      variantCount: product.variants.length,
      publishedVariantCount: publishedVariants.length,
      startingPrice: pricedVariant
        ? formatPrice(pricedVariant.price, pricedVariant.priceUnit)
        : null,
      updatedAt: product.updatedAt,
    };
  });
}

export async function getAdminProductById(
  id: string,
): Promise<AdminProduct | null> {
  const product = await getPrisma().product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!product) {
    return null;
  }

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    image: product.image,
    features: product.features,
    customNote: product.customNote,
    published: product.published,
    sortOrder: product.sortOrder,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      slug: variant.slug,
      name: variant.name,
      description: variant.description,
      price: variant.price,
      priceUnit: variant.priceUnit,
      image: variant.image,
      tags: variant.tags,
      published: variant.published,
      sortOrder: variant.sortOrder,
    })),
  };
}

export async function getCatalogStats() {
  const prisma = getPrisma();

  const [productCount, publishedProductCount, variantCount, bestSellerCount, customCount] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { published: true } }),
      prisma.productVariant.count(),
      prisma.productVariant.count({ where: { tags: { has: "Best Seller" } } }),
      prisma.product.count({ where: { variants: { none: {} } } }),
    ]);

  return {
    productCount,
    publishedProductCount,
    variantCount,
    bestSellerCount,
    customCount,
  };
}
