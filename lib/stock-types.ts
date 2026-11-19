// Tipe & konstanta stok varian — bebas import server-only karena dipakai
// komponen client (halaman stok admin).

export type FulfillmentMode = "PRE_ORDER" | "READY";

export type StockMovementType = "IN" | "OUT" | "ADJUST";

export type StockRow = {
  productId: string;
  productName: string;
  productImage: string;
  fulfillmentMode: FulfillmentMode;
  variantId: string;
  variantName: string;
  stockQty: number;
};

export type StockMovementRow = {
  id: string;
  type: StockMovementType;
  // Signed untuk tampilan: OUT selalu negatif, IN positif, ADJUST mengikuti
  // tanda koreksinya.
  qty: number;
  note: string | null;
  orderCode: string | null;
  createdAt: string; // ISO
};

export const STOCK_MOVEMENT_LABEL: Record<StockMovementType, string> = {
  IN: "Masuk",
  OUT: "Terpakai",
  ADJUST: "Koreksi",
};

export const FULFILLMENT_LABEL: Record<FulfillmentMode, string> = {
  PRE_ORDER: "Pre-order",
  READY: "Ready stock",
};
