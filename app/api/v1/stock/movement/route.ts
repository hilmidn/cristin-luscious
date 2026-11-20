import { ApiError, apiErrorResponse, requireApiUser } from "@/lib/api-auth";
import { adjustVariantStock, restockVariant } from "@/lib/stock";

export const dynamic = "force-dynamic";

type MovementBody = {
  variantId?: unknown;
  kind?: unknown;
  qty?: unknown;
  note?: unknown;
};

/**
 * POST /api/v1/stock/movement — atur stok jadi dari app mobile.
 * Body: { variantId, kind: "RESTOCK" | "ADJUST", qty, note? }
 * - RESTOCK: qty = jumlah masuk (positif).
 * - ADJUST : qty = stok akhir yang diinginkan (>= 0; delta dihitung server).
 * Semua lewat recordStockMovement (satu pintu: ledger + guard oversell).
 */
export async function POST(request: Request) {
  try {
    await requireApiUser(request);

    const body = (await request.json().catch(() => ({}))) as MovementBody;
    const variantId = typeof body.variantId === "string" ? body.variantId : "";
    const kind = typeof body.kind === "string" ? body.kind : "";
    const qtyRaw = body.qty;
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!variantId) {
      throw new ApiError(422, "Varian tidak valid.");
    }

    if (kind !== "RESTOCK" && kind !== "ADJUST") {
      throw new ApiError(422, "Jenis perubahan stok tidak dikenal.");
    }

    if (typeof qtyRaw !== "number" || !Number.isInteger(qtyRaw)) {
      throw new ApiError(422, "Jumlah stok harus bilangan bulat.");
    }

    if (kind === "RESTOCK") {
      await restockVariant(variantId, qtyRaw, note || null);
    } else {
      await adjustVariantStock(variantId, qtyRaw, note || null);
    }

    return Response.json({ ok: true });
  } catch (error) {
    // Pesan validasi dari lib/stock (oversell, qty tidak valid, dsb.)
    // diteruskan sebagai 422 agar tampil apa adanya di app.
    if (error instanceof Error && !(error instanceof ApiError)) {
      const known = [
        "Jumlah stok harus bilangan bulat selain nol.",
        "Stok masuk/keluar harus bilangan positif.",
        "Jumlah restock harus bilangan bulat positif.",
        "Stok akhir harus bilangan bulat minimal 0.",
        "Varian tidak ditemukan.",
      ];

      if (known.includes(error.message)) {
        return apiErrorResponse(new ApiError(422, error.message));
      }
    }

    return apiErrorResponse(error);
  }
}
