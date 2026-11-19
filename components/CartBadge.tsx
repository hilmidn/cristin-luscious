"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import {
  cartTotalQty,
  getCartSnapshot,
  parseCartSnapshot,
  subscribeCart,
} from "@/lib/cart-store";

/// Badge keranjang di navbar — count dari localStorage, ikut ter-update
/// setiap kali ada item ditambah/diubah (event cl-cart-change).
export default function CartBadge() {
  const snapshot = useSyncExternalStore(subscribeCart, getCartSnapshot, () => "");
  const count = cartTotalQty(parseCartSnapshot(snapshot));

  return (
    <Link
      href="/order"
      aria-label="Keranjang"
      className="relative flex items-center justify-center w-9 h-9 border border-brand-border text-brand-dark hover:border-brand-text bg-brand-card transition-colors"
    >
      <ShoppingBag size={16} />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center bg-brand-dark px-1 font-mono text-[9px] text-brand-bg">
          {count}
        </span>
      )}
    </Link>
  );
}
