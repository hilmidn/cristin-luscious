import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api-auth";
import { getAdminOrders, getRecapStats } from "@/lib/orders";
import { isMonthKeyValue, jakartaMonthKey } from "@/lib/order-types";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/orders/recap — rekap pesanan tertutup (SELESAI + DIBATALKAN)
 * untuk app mobile, basis bulan WIB (sama dengan halaman /admin/orders/recap):
 * - tanpa parameter : bulan berjalan
 * - ?month=YYYY-MM  : bulan tertentu
 * - ?all=1          : semua bulan
 */
export async function GET(request: Request) {
  try {
    await requireApiUser(request);

    const searchParams = new URL(request.url).searchParams;
    const monthParam = searchParams.get("month");
    const all = searchParams.get("all") === "1";

    let monthKey: string | null = null;

    if (!all) {
      if (monthParam) {
        if (!isMonthKeyValue(monthParam)) {
          throw new ApiError(422, "Format bulan harus YYYY-MM.");
        }

        monthKey = monthParam;
      } else {
        monthKey = jakartaMonthKey(new Date());
      }
    }

    const [orders, stats] = await Promise.all([
      getAdminOrders({
        statuses: ["SELESAI", "DIBATALKAN"],
        month: monthKey ?? undefined,
      }),
      getRecapStats(monthKey),
    ]);

    return Response.json({ ok: true, month: monthKey, stats, orders });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
