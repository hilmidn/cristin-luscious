import "server-only";

import { createSign } from "node:crypto";

/**
 * FCM HTTP v1 tanpa firebase-admin (hemat bundle & tanpa dependency baru):
 * - Service account dari env FIREBASE_SERVICE_ACCOUNT_JSON (JSON mentah,
 *   diset di Vercel / env lokal; file asli disimpan DI LUAR repo).
 * - Auth = JWT RS256 (node:crypto) ditukar OAuth2 access token (cache 1 jam).
 * - Kirim ke TOPIC "orders" — semua device app yang login subscribe topic
 *   ini, jadi tidak perlu tabel token per user.
 *
 * Env belum diset / auth gagal = notifikasi di-skip (checkout tidak boleh
 * gagal karena notifikasi).
 */

const FCM_TOPIC = "orders";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

export type NewOrderNotification = {
  code: string;
  customerName: string;
  itemCount: number;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ServiceAccount;

    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      console.error(
        "[fcm] FIREBASE_SERVICE_ACCOUNT_JSON tidak lengkap — notifikasi di-skip.",
      );
      return null;
    }

    return parsed;
  } catch {
    console.error("[fcm] FIREBASE_SERVICE_ACCOUNT_JSON bukan JSON valid.");
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  const account = readServiceAccount();

  if (!account) {
    return null;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const base64url = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  const unsignedJwt = `${base64url({ alg: "RS256", typ: "JWT" })}.${base64url({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;

  const signature = createSign("RSA-SHA256")
    .update(unsignedJwt)
    .sign(account.private_key, "base64url");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsignedJwt}.${signature}`,
    }),
  });

  if (!response.ok) {
    console.error("[fcm] OAuth gagal:", response.status, await response.text());
    return null;
  }

  const json = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!json.access_token) {
    return null;
  }

  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };

  return cachedToken.token;
}

/**
 * Kirim notifikasi "order web baru masuk" ke semua device admin.
 * Fire-and-forget: dipanggil dengan void .catch(() => undefined).
 */
export async function sendNewOrderNotification(
  input: NewOrderNotification,
): Promise<void> {
  const account = readServiceAccount();

  if (!account) {
    return;
  }

  const token = await getAccessToken();

  if (!token) {
    return;
  }

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          topic: FCM_TOPIC,
          notification: {
            title: "Pesanan web baru masuk",
            body: `${input.code} — ${input.customerName} · ${input.itemCount} item`,
          },
          data: { code: input.code, type: "new_order" },
          android: {
            priority: "HIGH",
            notification: { channel_id: "orders", tag: input.code },
          },
        },
      }),
    },
  );

  if (!response.ok) {
    console.error("[fcm] send gagal:", response.status, await response.text());
  }
}
