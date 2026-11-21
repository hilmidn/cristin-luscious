import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BOT_PATTERN = /bot|crawler|spider|curl|wget|headless|preview|lighthouse/i;
const MAX_PATH = 300;
const MAX_REFERRER = 500;
const MAX_SESSION_ID = 64;

function parseDevice(ua: string): "mobile" | "tablet" | "desktop" {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|Android.*Mobile|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

/**
 * POST /api/track — catat satu page view anonim. Selalu balas 204 tanpa
 * body: kegagalan tracking tidak boleh terlihat oleh pengunjung.
 */
export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") ?? "";

    if (!ua || BOT_PATTERN.test(ua)) {
      return new Response(null, { status: 204 });
    }

    const body = (await request.json().catch(() => null)) as {
      path?: unknown;
      referrer?: unknown;
      sid?: unknown;
    } | null;

    const path = typeof body?.path === "string" ? body.path : "";

    if (
      !path.startsWith("/") ||
      path.startsWith("/admin") ||
      path.startsWith("/api")
    ) {
      return new Response(null, { status: 204 });
    }

    const sid =
      typeof body?.sid === "string" && body.sid.length <= MAX_SESSION_ID
        ? body.sid
        : "";

    if (!sid) {
      return new Response(null, { status: 204 });
    }

    const referrer =
      typeof body?.referrer === "string" &&
      body.referrer.length <= MAX_REFERRER
        ? body.referrer
        : null;

    await getPrisma().pageView.create({
      data: {
        path: path.slice(0, MAX_PATH),
        referrer,
        device: parseDevice(ua),
        sessionId: sid,
      },
    });
  } catch {
    // Diabaikan: analytics tidak boleh mengganggu pengunjung.
  }

  return new Response(null, { status: 204 });
}
