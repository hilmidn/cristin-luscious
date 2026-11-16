import bcrypt from "bcryptjs";

import {
  API_TOKEN_TTL_DAYS,
  generateApiToken,
  hashApiToken,
} from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_TOKEN_NAME = 60;

/**
 * POST /api/v1/auth/login
 * Body: { email, password, name? } — name = nama device (opsional).
 * Tukar kredensial dengan token API (plain dikirim sekali, DB simpan hash).
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Permintaan tidak valid. Coba lagi." },
      { status: 400 },
    );
  }

  const payload = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
    name?: unknown;
  };

  // Pola sama dengan lib/auth.ts authorize: email di-trim + lowercase.
  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!email || !password) {
    return Response.json(
      { ok: false, error: "Email dan password wajib diisi." },
      { status: 422 },
    );
  }

  try {
    const user = await getPrisma().adminUser.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true },
    });

    if (!user) {
      return Response.json(
        { ok: false, error: "Email atau password salah." },
        { status: 401 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return Response.json(
        { ok: false, error: "Email atau password salah." },
        { status: 401 },
      );
    }

    const token = generateApiToken();
    const expiresAt = new Date(
      Date.now() + API_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    const tokenName =
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim().slice(0, MAX_TOKEN_NAME)
        : "mobile";

    await getPrisma().apiToken.create({
      data: {
        userId: user.id,
        tokenHash: hashApiToken(token),
        name: tokenName,
        expiresAt,
      },
    });

    return Response.json({
      ok: true,
      token,
      expiresAt: expiresAt.toISOString(),
      user: { name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("[api/v1/auth/login]", error);

    return Response.json(
      { ok: false, error: "Gagal login. Coba lagi." },
      { status: 500 },
    );
  }
}
