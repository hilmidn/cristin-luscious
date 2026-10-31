import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import PageHeading from "@/components/admin/PageHeading";
import ProductionCalendar from "@/components/admin/production/ProductionCalendar";
import ProductionDayPanel from "@/components/admin/production/ProductionDayPanel";
import {
  getProductionDay,
  getProductionMonth,
  getProductionOverview,
} from "@/lib/production";
import {
  formatMonthLabel,
  isDateKey,
  isMonthKey,
  monthKeyOf,
  shiftMonthKey,
  todayKey,
} from "@/lib/production-types";

export const metadata: Metadata = {
  title: "Produksi",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ month?: string; date?: string }>;
};

export default async function AdminProductionPage({ searchParams }: Props) {
  const params = await searchParams;
  const today = todayKey();

  const monthKey = isMonthKey(params.month) ? params.month : monthKeyOf(today);
  const dateKey = isDateKey(params.date)
    ? params.date
    : monthKey === monthKeyOf(today)
      ? today
      : `${monthKey}-01`;

  const [month, day, overview] = await Promise.all([
    getProductionMonth(monthKey),
    getProductionDay(dateKey),
    getProductionOverview(),
  ]);

  const previousMonth = shiftMonthKey(monthKey, -1);
  const nextMonth = shiftMonthKey(monthKey, 1);

  return (
    <>
      <PageHeading
        eyebrow="Dapur"
        title="Produksi"
        accent="kalender"
        description="Jawaban cepat untuk pertanyaan dapur: tanggal ini harus membuat apa, berapa banyak, dan sudah sampai tahap mana."
        actions={
          <Link
            href={`/admin/production?month=${monthKeyOf(today)}&date=${today}`}
            className="inline-flex items-center gap-2 border border-brand-dark bg-brand-dark px-5 py-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
          >
            <CalendarDays size={13} />
            Hari Ini
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Produksi Hari Ini
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {overview.todayReady}
            <span className="ml-2 font-sans text-[10px] font-normal uppercase tracking-[0.16em] text-brand-text">
              / {overview.todayItems} siap
            </span>
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Terlewat Jadwal
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {overview.overdue}
          </p>
        </div>
        <div className="border border-brand-border bg-brand-card px-4 py-3">
          <p className="font-sans text-[8px] font-bold uppercase tracking-[0.24em] text-brand-text">
            Item Aktif
          </p>
          <p className="mt-1 font-playfair text-2xl font-bold text-brand-dark">
            {overview.active}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-playfair text-lg font-bold uppercase tracking-tight text-brand-dark">
          {formatMonthLabel(monthKey)}
        </h2>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/production?month=${previousMonth}`}
            aria-label="Bulan sebelumnya"
            className="flex h-8 w-8 items-center justify-center border border-brand-border bg-brand-card text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark"
          >
            <ChevronLeft size={14} />
          </Link>
          <Link
            href={`/admin/production?month=${nextMonth}`}
            aria-label="Bulan berikutnya"
            className="flex h-8 w-8 items-center justify-center border border-brand-border bg-brand-card text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark"
          >
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.55fr_1fr]">
        <ProductionCalendar
          month={month}
          selectedDateKey={dateKey}
          today={today}
        />

        <div className="xl:sticky xl:top-6">
          <ProductionDayPanel day={day} />
        </div>
      </div>

      <p className="mt-4 font-sans text-[9px] uppercase tracking-[0.18em] text-brand-muted">
        Pesanan selesai atau dibatalkan otomatis hilang dari kalender.
      </p>
    </>
  );
}
