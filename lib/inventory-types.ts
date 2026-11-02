export type IngredientRow = {
  id: string;
  name: string;
  unit: string;
  stockQty: number;
  minStockQty: number;
  isLow: boolean;
  totalPurchased: number;
  note: string | null;
  recentPurchases: {
    id: string;
    qty: number;
    unitCost: number;
    totalCost: number;
    supplier: string | null;
    purchasedAt: Date;
  }[];
};

export type RecipeRow = {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  qtyPerUnit: number;
};

export type RecipeVariantNode = {
  variantId: string;
  variantName: string;
  topping: RecipeRow[];
};

export type RecipeProductNode = {
  productId: string;
  productName: string;
  base: RecipeRow[];
  variants: RecipeVariantNode[];
};

/** Satu baris bahan di dalam nota pembelian. */
export type PurchaseNoteItemInput = {
  ingredientId: string;
  qty: number;
  unitCost: number;
};

export type PurchaseNoteInput = {
  supplier?: string;
  note?: string;
  purchasedAt?: string; // ISO string, opsional (default sekarang)
  items: PurchaseNoteItemInput[];
};

export type PurchaseNoteItemRow = {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  qty: number;
  unitCost: number;
  totalCost: number;
};

export type PurchaseNoteRow = {
  id: string;
  supplier: string | null;
  note: string | null;
  totalCost: number;
  purchasedAt: Date;
  itemCount: number;
  items: PurchaseNoteItemRow[];
};

export type IngredientInput = {
  name: string;
  unit: string;
  minStockQty: number;
  note?: string;
};

export type RecipeItemInput = {
  productId?: string;
  variantId?: string;
  ingredientId: string;
  qtyPerUnit: number;
};
