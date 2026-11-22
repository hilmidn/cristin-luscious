"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dateKey(value: Date): string {
  return dateFmt.format(value);
}

function shiftDays(days: number): string {
  return dateKey(new Date(Date.now() + days * 86_400_000));
}

function monthStartKey(deltaMonths: number): string {
  const now = new Date();
  const shifted = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + deltaMonths, 1),
  );

  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function monthEndKey(deltaMonths: number): string {
  const now = new Date();
  const last = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + deltaMonths + 1, 0),
  );

  return dateKey(new Date(last.getTime() + 11 * 3_600_000));
}

const PRESETS: { label: string; range: () => [string, string] }[] = [
  { label: "Hari ini", range: () => [shiftDays(0), shiftDays(0)] },
  { label: "7 hari", range: () => [shiftDays(-6), shiftDays(0)] },
  { label: "Bulan ini", range: () => [monthStartKey(0), monthEndKey(0)] },
  { label: "Bulan lalu", range: () => [monthStartKey(-1), monthEndKey(-1)] },
];

type DateRangeFilterProps = {
  basePath: string;
  initialFrom: string;
  initialTo: string;
  /** Param lain yang dipertahankan (status, source, q, search...). */
  preserve?: Record<string, string | undefined>;
};

/** Filter rentang tanggal: chips preset + dua input date (GET). */
export default function DateRangeFilter({
  basePath,
  initialFrom,
  initialTo,
  preserve = {},
}: DateRangeFilterProps) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  const push = (nextFrom: string, nextTo: string) => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(preserve)) {
      if (value) params.set(key, value);
    }

    if (nextFrom && nextTo) {
      params.set("from", nextFrom);
      params.set("to", nextTo);
    }

    router.push(`${basePath}?${params.toString()}`);
  };

  const applyPreset = (range: () => [string, string]) => {
    const [nextFrom, nextTo] = range();

    setFrom(nextFrom);
    setTo(nextTo);
    push(nextFrom, nextTo);
  };

  const chipClass =
    "border px-3 py-1.5 font-sans text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          onClick={() => applyPreset(preset.range)}
          className={`${chipClass} border-brand-border bg-brand-card text-brand-text hover:border-brand-dark hover:text-brand-dark`}
        >
          {preset.label}
        </button>
      ))}
      <button
        onClick={() => push("", "")}
        className={`${chipClass} border-brand-border bg-brand-card text-brand-text hover:border-brand-dark hover:text-brand-dark`}
      >
        Semua
      </button>

      <span className="mx-1 h-5 w-px bg-brand-border" />

      <input
        type="date"
        value={from}
        onChange={(event) => setFrom(event.target.value)}
        className="border border-brand-border bg-brand-bg px-2.5 py-1.5 font-mono text-xs text-brand-dark"
        aria-label="Dari tanggal"
      />
      <span className="font-sans text-[10px] text-brand-muted">s.d.</span>
      <input
        type="date"
        value={to}
        onChange={(event) => setTo(event.target.value)}
        className="border border-brand-border bg-brand-bg px-2.5 py-1.5 font-mono text-xs text-brand-dark"
        aria-label="Sampai tanggal"
      />
      <button
        onClick={() => push(from, to)}
        disabled={!from || !to}
        className={`${chipClass} border-brand-dark bg-brand-dark text-brand-bg hover:bg-transparent hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-40`}
      >
        Terapkan
      </button>
    </div>
  );
}
