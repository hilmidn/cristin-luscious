import { apiErrorResponse, requireApiUser } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/stock — stok jadi per varian untuk app mobile.
 * Response: products[] (nama + fulfillmentMode + variants[] berisi stockQty).
 */
export async function GET(request: Request) {
  try {
    await requireApiUser(request);

    const products = await getPrisma().product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        fulfillmentMode: true,
        variants: {
          orderBy: { name: "asc" },
          select: { id: true, name: true, stockQty: true },
        },
      },
    });

    return Response.json({ ok: true, products });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
