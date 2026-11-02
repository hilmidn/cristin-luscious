import PageHeading from "@/components/admin/PageHeading";
import { IngredientsClient } from "@/components/admin/ingredients/IngredientsClient";
import { getIngredients } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function AdminIngredientsPage() {
  const ingredients = await getIngredients();

  return (
    <>
      <PageHeading
        eyebrow="Inventori"
        title="Bahan Baku"
        accent="& Stok"
        description="Kelola bahan baku, catat pembelian (stock-in), dan pantau sisa stok. Stok otomatis terpotong saat pesanan selesai produksi sesuai resep."
      />

      <div className="mt-8">
        <IngredientsClient ingredients={ingredients} />
      </div>
    </>
  );
}
