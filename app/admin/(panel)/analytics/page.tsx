import PageHeading from "@/components/admin/PageHeading";
import { AnalyticsClient } from "@/components/admin/analytics/AnalyticsClient";
import { getAnalyticsSummary } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengunjung",
};

export default async function AdminAnalyticsPage() {
  const summary = await getAnalyticsSummary(30);

  return (
    <>
      <PageHeading
        eyebrow="Insight"
        title="Pengunjung"
        accent="30 Hari"
        description="Kunjungan anonim per halaman — tanpa IP dan tanpa data pribadi. Session dihitung dari cookie anonim 1 tahun."
      />

      <div className="mt-8">
        <AnalyticsClient summary={summary} />
      </div>
    </>
  );
}
