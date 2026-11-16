import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { getPrisma } from "./prisma";

/**
 * Auth API mobile (/api/v1): kredensial email+password ditukar dengan token
 * acak; DB hanya menyimpan hash SHA-256-nya. Semua endpoint v1 memanggil
 * `requireApiUser(request)` sebagai guard.
 */

export type ApiUser = {
  id: string;
  name: string;
  email: string;
};

/** Error bermakna HTTP (401/404/422) yang aman dilempar dari handler. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Masa berlaku token default: 30 hari (cukup untuk app operasional harian). */
export const API_TOKEN_TTL_DAYS = 30;

export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Token acak 32 byte, dikirim ke client SEKALI saat login (plain, tidak disimpan). */
export function generateApiToken(): string {
  return randomBytes(32).toString("hex");
}

function bearerToken(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());

  if (!match) {
    throw new ApiError(401, "Sesi berakhir. Silakan login ulang.");
  }

  return match[1];
}

/**
 * Verifikasi Bearer token lalu kembalikan user + identitas token.
 * Lempar ApiError 401 bila token tidak ada, tidak dikenal, atau kedaluwarsa.
 */
export async function requireApiToken(
  request: Request,
): Promise<{ user: ApiUser; tokenId: string; tokenHash: string }> {
  const tokenHash = hashApiToken(bearerToken(request));

  const apiToken = await getPrisma().apiToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!apiToken || apiToken.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(401, "Sesi tidak valid. Silakan login ulang.");
  }

  // Catat pemakaian terakhir tanpa menahan respons (best-effort).
  void getPrisma()
    .apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => undefined);

  return {
    user: apiToken.user,
    tokenId: apiToken.id,
    tokenHash,
  };
}

/** Guard standar: hanya butuh user-nya. */
export async function requireApiUser(request: Request): Promise<ApiUser> {
  const { user } = await requireApiToken(request);

  return user;
}

/**
 * Pemetaan error -> response JSON seragam { ok, error }.
 * ApiError membawa status HTTP-nya; error lain dicatat lalu jadi 500 generik.
 */
export function apiErrorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { ok: false, error: error.message },
      { status: error.status },
    );
  }

  console.error("[api/v1]", error);

  return Response.json(
    { ok: false, error: "Terjadi kesalahan di server." },
    { status: 500 },
  );
}
