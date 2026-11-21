"use client";

import type { AnalyticsSummary } from "@/lib/analytics";

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-brand-border bg-brand-card px-5 py-4">
      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.24em] text-brand-text">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold text-brand-dark">
        {value}
      </p>
    </div>
  );
}

function BarList({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <div className="border border-brand-border bg-brand-card p-5">
      <p className="font-sans text-[9px] font-bold uppercase tracking-[0.24em] text-brand-text">
        {title}
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 font-sans text-[11px] text-brand-muted">
          Belum ada data.
        </p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between gap-3 font-sans text-[11px]">
                <span className="min-w-0 truncate text-brand-dark">
                  {row.label}
                </span>
                <span className="shrink-0 font-mono font-semibold text-brand-text">
                  {row.count}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-brand-border/60">
                <div
                  className="h-full bg-brand-dark"
                  style={{ width: `${Math.round((row.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnalyticsClient({ summary }: { summary: AnalyticsSummary }) {
  const maxDaily = Math.max(1, ...summary.daily.map((day) => day.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBox label="Total kunjungan (30 hari)" value={summary.totalViews} />
        <StatBox label="Kunjungan hari ini" value={summary.todayViews} />
        <StatBox label="Pengunjung unik" value={summary.uniqueSessions} />
      </div>

      <div className="border border-brand-border bg-brand-card p-5">
        <p className="font-sans text-[9px] font-bold uppercase tracking-[0.24em] text-brand-text">
          Kunjungan per hari (WIB)
        </p>
        <div className="mt-4 flex h-32 items-end gap-1">
          {summary.daily.map((day) => (
            <div
              key={day.label}
              title={`${day.label}: ${day.count}`}
              className="flex-1 bg-brand-dark/80"
              style={{
                height: `${Math.max(2, Math.round((day.count / maxDaily) * 100))}%`,
              }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between font-sans text-[9px] text-brand-muted">
          <span>{summary.daily[0]?.label}</span>
          <span>{summary.daily[summary.daily.length - 1]?.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BarList title="Halaman teratas" rows={summary.topPages} />
        <BarList title="Sumber kunjungan" rows={summary.referrers} />
        <BarList title="Perangkat" rows={summary.devices} />
      </div>
    </div>
  );
}
