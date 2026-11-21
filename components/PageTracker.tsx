"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Visitor tracker anonim — dipasang di layout publik. Kirim satu page view
 * per perubahan path via sendBeacon (fallback fetch keepalive). Session
 * anonim = cookie uuid sendiri, tanpa IP/PII. Path /admin & /api tidak
 * dilacak. Halaman ISR-cached tetap terhitung karena tracking jalan di
 * sisi client.
 */

const SESSION_COOKIE = "bs_sid";

function getSessionId(): string {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]*)`),
  );

  if (match?.[1]) {
    return decodeURIComponent(match[1]);
  }

  const sid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(
    sid,
  )}; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`;

  return sid;
}

export default function PageTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (
      !pathname ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api")
    ) {
      return;
    }

    if (lastTracked.current === pathname) {
      return;
    }

    lastTracked.current = pathname;

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || undefined,
      sid: getSessionId(),
    });

    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(
        "/api/track",
        new Blob([payload], { type: "application/json" }),
      );
      return;
    }

    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
