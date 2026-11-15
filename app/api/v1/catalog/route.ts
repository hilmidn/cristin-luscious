import { apiErrorResponse, requireApiUser } from "@/lib/api-auth";
import { getOrderableProducts } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/catalog — produk terbit + varian terbit untuk picker pesanan.
 * Bentuk data sama dengan yang dipakai form pesanan admin.
 */
export async function GET(request: Request) {
  try {
    await requireApiUser(request);

    const products = await getOrderableProducts();

    return Response.json({ ok: true, products });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
