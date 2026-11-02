import PageHeading from "@/components/admin/PageHeading";
import { RecipesClient } from "@/components/admin/recipes/RecipesClient";
import { getIngredients, getRecipeMatrix } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function AdminRecipesPage() {
  const [products, ingredients] = await Promise.all([
    getRecipeMatrix(),
    getIngredients(),
  ]);

  return (
    <>
      <PageHeading
        eyebrow="Inventori"
        title="Resep Produk"
        accent="& Topping"
        description="Resep dua level: Base Recipe dipakai semua varian produk, Topping Recipe hanya untuk varian tertentu. Stok bahan terpotong otomatis per pcs saat nota selesai produksi."
      />

      <div className="mt-8">
        <RecipesClient products={products} ingredients={ingredients} />
      </div>
    </>
  );
}
