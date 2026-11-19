"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import {
  cartTotalQty,
  getCartSnapshot,
  parseCartSnapshot,
  subscribeCart,
} from "@/lib/cart-store";

/// Floating bar keranjang — muncul di semua halaman publik selama keranjang
/// berisi. Tersembunyi di /order (checkout sudah menampilkan keranjang
/// lengkap) dan saat kosong.
export default function FloatingCartBar() {
  const pathname = usePathname();
  const snapshot = useSyncExternalStore(subscribeCart, getCartSnapshot, () => "");
  const count = cartTotalQty(parseCartSnapshot(snapshot));

  if (pathname === "/order" || count === 0) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-30 sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2">
      <Link
        href="/order"
        className="flex items-center justify-between gap-4 border border-brand-dark bg-brand-dark px-5 py-4 text-brand-bg shadow-2xl transition-colors hover:bg-brand-card hover:text-brand-dark"
      >
        <span className="flex items-center gap-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.18em]">
          <ShoppingBag size={16} />
          {count} item di keranjang
        </span>
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] underline underline-offset-4 decoration-brand-bg/40">
          Checkout
        </span>
      </Link>
    </div>
  );
}
