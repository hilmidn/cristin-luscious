import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api-auth";
import { saveOrderCore } from "@/lib/order-save";
import type { OrderInput } from "@/lib/order-types";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/orders — buat nota baru dari app mobile.
 * Body = OrderInput (bentuk sama dengan form admin). Validasi & pembuatan
 * nota memakai inti yang sama dengan server action admin (saveOrderCore).
 * Edit/hapus pesanan dari mobile: out of scope v1.
 */
export async function POST(request: Request) {
  try {
    await requireApiUser(request);

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Body harus JSON valid.");
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new ApiError(422, "Struktur data pesanan tidak valid.");
    }

    const input = body as OrderInput;

    if (
      typeof input.customerName !== "string" ||
      typeof input.phone !== "string" ||
      typeof input.address !== "string" ||
      !Array.isArray(input.items) ||
      input.items.length === 0
    ) {
      throw new ApiError(422, "Struktur data pesanan tidak valid.");
    }

    const result = await saveOrderCore(input);

    return Response.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
