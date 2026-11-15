import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/orders/:code — detail satu nota berdasarkan kode invoice
 * (mis. CL-261116-001), untuk halaman print di app mobile.
 */
export async function GET(
  request: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  try {
    await requireApiUser(request);

    const { code } = await ctx.params;
    const normalized = decodeURIComponent(code).trim();

    if (!normalized) {
      throw new ApiError(422, "Kode pesanan tidak valid.");
    }

    const order = await getPrisma().order.findUnique({
      where: { code: normalized },
      include: {
        items: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!order) {
      throw new ApiError(404, "Pesanan tidak ditemukan.");
    }

    return Response.json({ ok: true, order });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
