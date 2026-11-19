import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api-auth";
import { changeOrderStatus } from "@/lib/order-status";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-types";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/orders/:code/status — ubah status satu nota (konfirmasi
 * manual dari app mobile: BARU → SELESAI_PRODUKSI memotong bahan, batal
 * mengembalikan stok jadi). Aturan bisnis ada di lib/order-status.ts.
 */
export async function PATCH(
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

    let body: { status?: unknown };

    try {
      body = (await request.json()) as { status?: unknown };
    } catch {
      throw new ApiError(422, "Body permintaan tidak valid.");
    }

    const status = body?.status;

    if (typeof status !== "string" || !ORDER_STATUSES.includes(status as OrderStatus)) {
      throw new ApiError(422, "Status tidak valid.");
    }

    const order = await getPrisma().order.findUnique({
      where: { code: normalized },
      select: { id: true },
    });

    if (!order) {
      throw new ApiError(404, "Pesanan tidak ditemukan.");
    }

    await changeOrderStatus(order.id, status as OrderStatus);

    return Response.json({ ok: true, order: { code: normalized, status } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
