import PageHeading from "@/components/admin/PageHeading";
import { CustomerTable } from "@/components/admin/customers/CustomerTable";
import { getCustomers } from "@/lib/customers";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string; sort?: string }>;
};

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const customers = await getCustomers({
    q: params.q,
    sort: params.sort as any,
  });

  return (
    <>
      <PageHeading
        eyebrow="Penjualan"
        title="Direktori Pelanggan"
        accent="& LTV"
        description="Daftar pelanggan terpusat yang diagregasi dari riwayat pesanan (berdasarkan nomor HP). Lihat Customer Lifetime Value (LTV), total pesanan, dan buat pesanan baru langsung."
      />

      <div className="mt-8">
        <CustomerTable
          customers={customers}
          initialSearch={params.q ?? ""}
          initialSort={params.sort ?? "spent_desc"}
        />
      </div>
    </>
  );
}
