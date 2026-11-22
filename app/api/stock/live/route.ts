import { getPublishedVariantStockMap } from "@/lib/stock";

export const dynamic = "force-dynamic";

/**
 * GET /api/stock/live — map stok varian published untuk polling client
 * (checkout + detail produk). Payload kecil; no-store supaya selalu fresh.
 */
export async function GET() {
  const stock = await getPublishedVariantStockMap();

  return Response.json(
    { ok: true, stock },
    { headers: { "cache-control": "no-store" } },
  );
}
