/**
 * Shared catalog types and pure helpers.
 *
 * This module must stay free of server-only imports so client components
 * (product detail, admin forms) can import types and formatting safely.
 */

export type CatalogVariant = {
  id: string;
  name: string;
  description: string;
  /** Already formatted for display, e.g. "Rp 45.000 / 6 pcs". */
  price: string | null;
  image: string;
  tags: string[];
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  features: string[];
  hasVariants: boolean;
  variants: CatalogVariant[];
  customNote?: string;
};

export type VariantInput = {
  id?: string;
  name: string;
  description: string;
  price: number | null;
  priceUnit: string | null;
  image: string;
  tags: string[];
  published: boolean;
  sortOrder: number;
};

export type ProductInput = {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  features: string[];
  customNote: string | null;
  published: boolean;
  sortOrder: number;
  variants: VariantInput[];
};

export type AdminVariant = {
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

export type AdminProduct = {
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
  variants: AdminVariant[];
};

export type AdminProductListItem = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  image: string;
  published: boolean;
  sortOrder: number;
  variantCount: number;
  publishedVariantCount: number;
  startingPrice: string | null;
  updatedAt: Date;
};

export function formatPrice(
  price: number | null | undefined,
  unit?: string | null,
): string | null {
  if (price === null || price === undefined) {
    return null;
  }

  const amount = new Intl.NumberFormat("id-ID").format(price);
  const suffix = unit?.trim();

  return suffix ? `Rp ${amount} / ${suffix}` : `Rp ${amount}`;
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "dan")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseTags(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

/**
 * Images must either live in /public or come from UploadThing, so next/image
 * never receives a host that is not allowlisted in next.config.ts.
 */
export function isAllowedImagePath(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(trimmed);

    return (
      url.protocol === "https:" &&
      (url.hostname.endsWith(".ufs.sh") || url.hostname === "utfs.io")
    );
  } catch {
    return false;
  }
}

/** Gambar yang tampil saat produk/varian tidak punya foto. */
export const PRODUCT_IMAGE_PLACEHOLDER = "/placeholder-product.png";

/**
 * Kembalikan src gambar yang aman dirender. Nilai kosong atau tidak valid
 * otomatis jatuh ke placeholder, jadi gambar boleh dikosongkan di form admin.
 */
export function productImageSrc(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";

  return isAllowedImagePath(trimmed) ? trimmed : PRODUCT_IMAGE_PLACEHOLDER;
}
