import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api-auth";
import { getActiveOrders } from "@/lib/orders";
import { isMonthKeyValue } from "@/lib/order-types";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/orders/active — rekap pesanan berjalan (BARU, DIPROSES,
 * SELESAI_PRODUKSI) untuk app mobile, urut jadwal ambil/kirim terdekat.
 * - tanpa parameter : semua pesanan berjalan
 * - ?month=YYYY-MM  : filter bulan WIB berdasarkan tanggal ambil/kirim
 */
export async function GET(request: Request) {
  try {
    await requireApiUser(request);

    const monthParam = new URL(request.url).searchParams.get("month");

    if (monthParam && !isMonthKeyValue(monthParam)) {
      throw new ApiError(422, "Format bulan harus YYYY-MM.");
    }

    const orders = await getActiveOrders(
      monthParam ? { month: monthParam } : {},
    );

    const total = orders.reduce((sum, order) => sum + order.total, 0);

    return Response.json({
      ok: true,
      count: orders.length,
      total,
      orders,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
