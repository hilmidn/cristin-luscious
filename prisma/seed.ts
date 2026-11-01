import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { getPrisma } from "../lib/prisma";
import { seedProducts } from "./seed-data";

config({ path: ".env.local" });
config();

let prisma: ReturnType<typeof getPrisma> | undefined;

async function seedAdmin(client: ReturnType<typeof getPrisma>) {
  const name = process.env.ADMIN_NAME?.trim() || "Cristin Admin";
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL dan ADMIN_PASSWORD wajib diset di .env.local sebelum seeding.",
    );
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD minimal 8 karakter.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await client.adminUser.upsert({
    where: { email },
    update: { name, password: passwordHash },
    create: { name, email, password: passwordHash },
  });

  console.log(`Admin siap: ${admin.email} (${admin.name})`);
}

async function seedCatalog(client: ReturnType<typeof getPrisma>) {
  const existingProducts = await client.product.count();

  // Seed katalog hanya untuk database baru. Begitu ada produk, katalog
  // sepenuhnya dikelola dari /admin — seed tidak boleh menghapus/menimpa.
  if (existingProducts > 0) {
    console.log(
      `Katalog dilewati: sudah ada ${existingProducts} produk. ` +
        "Seed katalog hanya berjalan sekali, saat tabel produk masih kosong.",
    );
    return;
  }

  for (const product of seedProducts) {
    await client.product.create({
      data: {
        slug: product.slug,
        name: product.name,
        tagline: product.tagline,
        description: product.description,
        image: product.image,
        features: product.features,
        customNote: product.customNote,
        published: product.published,
        sortOrder: product.sortOrder,
        variants: {
          create: product.variants.map((variant) => ({
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
        },
      },
    });
  }

  console.log(
    `Katalog siap: ${seedProducts.length} produk, ` +
      `${seedProducts.reduce((total, product) => total + product.variants.length, 0)} varian.`,
  );
}

async function main() {
  prisma = getPrisma();

  await seedAdmin(prisma);
  await seedCatalog(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
