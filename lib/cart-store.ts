// Keranjang web publik — disimpan di localStorage (tanpa akun). Hanya
// variantId + qty yang disimpan; nama & harga selalu diambil dari data
// katalog saat render supaya tidak pernah basi.
//
// Semua mutasi men-dispatch event `cl-cart-change` supaya badge navbar dan
// halaman checkout ikut ter-update tanpa prop-drilling.

export const CART_EVENT = "cl-cart-change";

const STORAGE_KEY = "cl-cart-v1";

export type CartMap = Record<string, number>;

export function readCart(): CartMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    return parseCartSnapshot(raw);
  } catch {
    return {};
  }
}

/// Snapshot STRING untuk useSyncExternalStore (nilai stabil antar-call).
/// Server snapshot = string kosong -> keranjang kosong saat hydrate.
export function getCartSnapshot(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

export function subscribeCart(callback: () => void): () => void {
  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function parseCartSnapshot(raw: string): CartMap {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as CartMap;
    const clean: CartMap = {};

    for (const [variantId, qty] of Object.entries(parsed)) {
      const safe = Number(qty);
      if (Number.isInteger(safe) && safe > 0) {
        clean[variantId] = Math.min(99, safe);
      }
    }

    return clean;
  } catch {
    return {};
  }
}

function writeCart(cart: CartMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function addToCart(variantId: string, qty = 1) {
  const cart = readCart();
  cart[variantId] = Math.min(99, (cart[variantId] ?? 0) + Math.max(1, qty));
  writeCart(cart);
}

export function setCartQty(variantId: string, qty: number) {
  const cart = readCart();

  if (!Number.isInteger(qty) || qty <= 0) {
    delete cart[variantId];
  } else {
    cart[variantId] = Math.min(99, qty);
  }

  writeCart(cart);
}

export function removeFromCart(variantId: string) {
  const cart = readCart();
  delete cart[variantId];
  writeCart(cart);
}

export function clearCart() {
  writeCart({});
}

/// Total kuantitas (bukan jumlah baris) untuk badge navbar.
export function cartTotalQty(cart: CartMap): number {
  return Object.values(cart).reduce((acc, qty) => acc + qty, 0);
}
