import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api-auth";
import { getAdminOrders, getRecapStats } from "@/lib/orders";
import {
  isDateKeyValue,
  isMonthKeyValue,
  jakartaMonthKey,
  type OrderStatus,
} from "@/lib/order-types";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/orders/recap — rekap pesanan tertutup (SELESAI + DIBATALKAN)
 * untuk app mobile, basis tanggal ambil/kirim WIB (sama dengan halaman
 * /admin/orders/recap):
 * - tanpa parameter     : bulan berjalan
 * - ?from=&to=          : rentang tanggal YYYY-MM-DD (inklusif)
 * - ?month=YYYY-MM      : bulan tertentu (APK lama, backward compat)
 * - ?all=1              : semua waktu
 */
export async function GET(request: Request) {
  try {
    await requireApiUser(request);

    const searchParams = new URL(request.url).searchParams;
    const monthParam = searchParams.get("month");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const all = searchParams.get("all") === "1";

    let period: { month?: string; from?: string; to?: string } | null = null;

    if (!all) {
      if (fromParam || toParam) {
        if (
          !isDateKeyValue(fromParam ?? undefined) ||
          !isDateKeyValue(toParam ?? undefined)
        ) {
          throw new ApiError(422, "Format tanggal harus YYYY-MM-DD.");
        }

        period = { from: fromParam!, to: toParam! };
      } else if (monthParam) {
        if (!isMonthKeyValue(monthParam)) {
          throw new ApiError(422, "Format bulan harus YYYY-MM.");
        }

        period = { month: monthParam };
      } else {
        period = { month: jakartaMonthKey(new Date()) };
      }
    }

    const [orders, stats] = await Promise.all([
      getAdminOrders({
        statuses: ["SELESAI", "DIBATALKAN"] as OrderStatus[],
        month: period?.month,
        from: period?.from,
        to: period?.to,
      }),
      getRecapStats(period),
    ]);

    return Response.json({
      ok: true,
      month: period?.month ?? null,
      from: period?.from ?? null,
      to: period?.to ?? null,
      stats,
      orders,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
