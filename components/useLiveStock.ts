"use client";

import { useCallback, useEffect, useState } from "react";

const POLL_INTERVAL_MS = 20_000;

/**
 * Hidupkan map stok varian: poll /api/stock/live tiap 20 detik SAAT tab
 * visible, plus refetch instan saat tab kembali aktif. Fetch gagal = pakai
 * data terakhir (diam, tanpa ganggu UI). Tanpa websocket — perubahan stok
 * toko bakery jarang, polling ringan sudah terasa realtime.
 *
 * `initial` hanya seed render pertama; kebaruan data dijaga polling.
 */
export function useLiveStock(initial: Record<string, number>) {
  const [stock, setStock] = useState(initial);

  const fetchStock = useCallback(async () => {
    try {
      const res = await fetch("/api/stock/live", { cache: "no-store" });

      if (!res.ok) return;

      const data = (await res.json()) as {
        ok?: boolean;
        stock?: Record<string, number>;
      };

      if (data?.ok && data.stock && typeof data.stock === "object") {
        setStock(data.stock);
      }
    } catch {
      // Jaringan gagal: pertahankan data terakhir.
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") {
        void fetchStock();
      }
    };

    const id = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [fetchStock]);

  return stock;
}
