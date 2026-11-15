import { apiErrorResponse, requireApiToken } from "@/lib/api-auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/auth/logout — hapus token yang dipakai request ini.
 * Client tinggal buang token lokal setelah panggil ini.
 */
export async function DELETE(request: Request) {
  try {
    const { tokenId } = await requireApiToken(request);

    await getPrisma().apiToken.delete({ where: { id: tokenId } });

    return Response.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
