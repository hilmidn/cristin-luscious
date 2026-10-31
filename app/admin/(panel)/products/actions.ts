"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { slugify, isAllowedImagePath, type ProductInput } from "@/lib/catalog-types";

export type SaveProductResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type SimpleActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Sesi admin tidak valid. Silakan login ulang.");
  }
}

function revalidateCatalog(slugs: string[]) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/products");

  for (const slug of slugs.filter(Boolean)) {
    revalidatePath(`/products/${slug}`);
  }
}

function normalizeSlug(value: string, fallback: string) {
  return slugify(value) || slugify(fallback);
}

function nextUniqueSlug(base: string, used: Set<string>) {
  const safeBase = base || "varian";
  let candidate = safeBase;
  let counter = 2;

  while (used.has(candidate)) {
    candidate = `${safeBase}-${counter}`;
    counter += 1;
  }

  used.add(candidate);
  return candidate;
}

function parsePrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Harga varian tidak valid.");
  }

  return Math.round(value);
}

function validateInput(input: ProductInput) {
  if (!input.name?.trim()) throw new Error("Nama produk wajib diisi.");
  if (!input.tagline?.trim()) throw new Error("Tagline wajib diisi.");
  if (!input.description?.trim()) throw new Error("Deskripsi wajib diisi.");

  // Gambar boleh kosong: halaman tampilan akan memakai placeholder.
  validateImagePath(input.image, "Gambar produk");

  for (const variant of input.variants) {
    if (!variant.name?.trim()) {
      throw new Error("Setiap varian wajib punya nama.");
    }
    if (!variant.description?.trim()) {
      throw new Error(`Deskripsi varian "${variant.name}" wajib diisi.`);
    }
    validateImagePath(
      variant.image,
      `Gambar varian "${variant.name}"`,
    );
  }
}

function validateImagePath(value: string | null | undefined, label: string) {
  const trimmed = value?.trim();

  if (!trimmed) return;

  if (!isAllowedImagePath(trimmed)) {
    throw new Error(
      `${label} harus diunggah lewat UploadThing atau memakai path lokal.`,
    );
  }
}

export async function saveProduct(
  input: ProductInput,
): Promise<SaveProductResult> {
  try {
    await requireAdmin();
    validateInput(input);

    const prisma = getPrisma();
    const slug = normalizeSlug(input.slug, input.name);

    if (!slug) {
      return { ok: false, error: "Slug produk tidak valid." };
    }

    const duplicate = await prisma.product.findFirst({
      where: {
        slug,
        ...(input.id ? { id: { not: input.id } } : {}),
      },
      select: { id: true, slug: true },
    });

    if (duplicate) {
      return {
        ok: false,
        error: `Slug "${slug}" sudah dipakai produk lain.`,
      };
    }

    const existing = input.id
      ? await prisma.product.findUnique({
          where: { id: input.id },
          select: { id: true, slug: true },
        })
      : null;

    if (input.id && !existing) {
      return { ok: false, error: "Produk tidak ditemukan." };
    }

    const productId = await prisma.$transaction(async (tx) => {
      const productData = {
        slug,
        name: input.name.trim(),
        tagline: input.tagline.trim(),
        description: input.description.trim(),
        image: input.image?.trim() ?? "",
        features: input.features.map((feature) => feature.trim()).filter(Boolean),
        customNote: input.customNote?.trim() || null,
        published: input.published,
        sortOrder: Number.isFinite(input.sortOrder)
          ? Math.round(input.sortOrder)
          : 0,
      };

      const product = input.id
        ? await tx.product.update({
            where: { id: input.id },
            data: productData,
            select: { id: true },
          })
        : await tx.product.create({
            data: productData,
            select: { id: true },
          });

      const existingVariants = await tx.productVariant.findMany({
        where: { productId: product.id },
        select: { id: true, slug: true },
      });
      const existingById = new Map(
        existingVariants.map((variant) => [variant.id, variant]),
      );

      const usedSlugs = new Set<string>();
      const keptIds: string[] = [];

      for (const [index, variant] of input.variants.entries()) {
        const current = variant.id ? existingById.get(variant.id) : undefined;
        const data = {
          name: variant.name.trim(),
          description: variant.description.trim(),
          price: parsePrice(variant.price),
          priceUnit: variant.priceUnit?.trim() || null,
          image: variant.image?.trim() ?? "",
          tags: variant.tags.map((tag) => tag.trim()).filter(Boolean),
          published: variant.published,
          sortOrder: Number.isFinite(variant.sortOrder)
            ? Math.round(variant.sortOrder)
            : index,
        };

        if (current) {
          usedSlugs.add(current.slug);
          await tx.productVariant.update({
            where: { id: current.id },
            data,
          });
          keptIds.push(current.id);
          continue;
        }

        const variantSlug = nextUniqueSlug(
          slugify(variant.name) || `varian-${index + 1}`,
          usedSlugs,
        );

        const created = await tx.productVariant.create({
          data: {
            ...data,
            productId: product.id,
            slug: variantSlug,
          },
          select: { id: true },
        });

        keptIds.push(created.id);
      }

      await tx.productVariant.deleteMany({
        where: {
          productId: product.id,
          id: { notIn: keptIds },
        },
      });

      return product.id;
    });

    revalidateCatalog([slug, existing?.slug ?? ""]);

    return { ok: true, id: productId };
  } catch (error) {
    console.error("saveProduct", error);

    const message =
      error instanceof Error ? error.message : "Gagal menyimpan produk.";

    return {
      ok: false,
      error: message.includes("\n")
        ? "Gagal menyimpan produk. Periksa kembali data."
        : message,
    };
  }
}

export async function deleteProduct(id: string): Promise<SimpleActionResult> {
  try {
    await requireAdmin();

    const product = await getPrisma().product.findUnique({
      where: { id },
      select: { slug: true },
    });

    if (!product) {
      return { ok: false, error: "Produk tidak ditemukan." };
    }

    await getPrisma().product.delete({ where: { id } });
    revalidateCatalog([product.slug]);

    return { ok: true };
  } catch (error) {
    console.error("deleteProduct", error);
    return { ok: false, error: "Gagal menghapus produk." };
  }
}

export async function setProductPublished(
  id: string,
  published: boolean,
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();

    const product = await getPrisma().product.update({
      where: { id },
      data: { published },
      select: { slug: true },
    });

    revalidateCatalog([product.slug]);
    return { ok: true };
  } catch (error) {
    console.error("setProductPublished", error);
    return { ok: false, error: "Gagal mengubah status produk." };
  }
}

export async function setVariantPublished(
  id: string,
  published: boolean,
): Promise<SimpleActionResult> {
  try {
    await requireAdmin();

    const variant = await getPrisma().productVariant.update({
      where: { id },
      data: { published },
      select: { product: { select: { slug: true } } },
    });

    revalidateCatalog([variant.product.slug]);
    return { ok: true };
  } catch (error) {
    console.error("setVariantPublished", error);
    return { ok: false, error: "Gagal mengubah status varian." };
  }
}
