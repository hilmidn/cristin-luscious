import PageHeading from "@/components/admin/PageHeading";
import { PurchasesClient } from "@/components/admin/ingredients/PurchasesClient";
import { getPurchaseNotes } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function PurchaseNotesPage() {
  const notes = await getPurchaseNotes();

  return (
    <>
      <PageHeading
        eyebrow="Inventori"
        title="Rekap Pembelian"
        accent="per Nota"
        description="Riwayat nota pembelian bahan baku. Setiap nota berisi satu atau beberapa bahan; stok tiap bahan sudah ditambahkan saat nota disimpan."
      />

      <div className="mt-8">
        <PurchasesClient notes={notes} />
      </div>
    </>
  );
}
