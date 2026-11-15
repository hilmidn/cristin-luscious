import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api-auth";
import { isDateKey, isMonthKey } from "@/lib/production-types";
import { getProductionDay, getProductionMonth } from "@/lib/production";
import { jakartaDateKey } from "@/lib/order-types";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/production — papan produksi untuk app mobile.
 * - ?date=YYYY-MM-DD : detail satu hari (grup per produk + taskIds + stage)
 * - ?month=YYYY-MM   : ringkasan kalender sebulan (opsional, boleh bersamaan)
 * - tanpa parameter  : hari ini (WIB)
 */
export async function GET(request: Request) {
  try {
    await requireApiUser(request);

    const searchParams = new URL(request.url).searchParams;
    const dateParam = searchParams.get("date");
    const monthParam = searchParams.get("month");

    if (dateParam && !isDateKey(dateParam)) {
      throw new ApiError(422, "Format tanggal harus YYYY-MM-DD.");
    }

    if (monthParam && !isMonthKey(monthParam)) {
      throw new ApiError(422, "Format bulan harus YYYY-MM.");
    }

    const dateKey = dateParam ?? jakartaDateKey(new Date());
    const day = await getProductionDay(dateKey);

    const month = monthParam ? await getProductionMonth(monthParam) : null;

    return Response.json({ ok: true, day, month });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
