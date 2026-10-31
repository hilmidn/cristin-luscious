import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { getPrisma } from "../lib/prisma";

config({ path: ".env.local" });
config();

let prisma: ReturnType<typeof getPrisma> | undefined;

async function main() {
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

  prisma = getPrisma();
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { name, password: passwordHash },
    create: { name, email, password: passwordHash },
  });

  console.log(`Admin siap: ${admin.email} (${admin.name})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
