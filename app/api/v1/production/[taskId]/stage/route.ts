import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api-auth";
import { applyProductionStage } from "@/lib/production-stage";
import type { ProductionStage } from "@/lib/production-types";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/production/:taskId/stage — maju/mundur tahap produksi.
 * Body: { stage, taskIds? }.
 * - taskIds kosong: hanya task di URL yang diubah.
 * - taskIds terisi : seluruh grup produk diubah sekaligus (satu kartu papan
 *   produksi = satu produk pada satu tanggal, semua task-nya satu tahap).
 *
 * Saat semua task nota mencapai SIAP, status nota otomatis jadi
 * SELESAI_PRODUKSI dan stok bahan dipotong (delta, idempotent) — persis
 * jalur admin.
 */
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ taskId: string }> },
) {
  try {
    await requireApiUser(request);

    const { taskId } = await ctx.params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Body harus JSON valid.");
    }

    const payload = (body ?? {}) as { stage?: unknown; taskIds?: unknown };

    if (typeof payload.stage !== "string") {
      throw new ApiError(422, "Tahap produksi wajib diisi.");
    }

    const stage = payload.stage as ProductionStage;

    let taskIds: string[];

    if (payload.taskIds === undefined || payload.taskIds === null) {
      taskIds = [taskId];
    } else {
      if (
        !Array.isArray(payload.taskIds) ||
        payload.taskIds.some((id) => typeof id !== "string")
      ) {
        throw new ApiError(422, "Grup produksi tidak valid.");
      }

      taskIds = payload.taskIds as string[];
    }

    const result = await applyProductionStage(taskIds, stage);

    return Response.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
