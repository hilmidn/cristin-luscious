import Link from "next/link";
import {
  buildMonthGrid,
  PRODUCTION_WEEKDAYS,
  type ProductionMonth,
} from "@/lib/production-types";

type ProductionCalendarProps = {
  month: ProductionMonth;
  selectedDateKey?: string;
  today: string;
};

export default function ProductionCalendar({
  month,
  selectedDateKey,
  today,
}: ProductionCalendarProps) {
  const cells = buildMonthGrid(month.monthKey);

  return (
    <div className="border border-brand-border bg-brand-bg">
      <div className="grid grid-cols-7 border-b border-brand-border bg-brand-card">
        {PRODUCTION_WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center font-sans text-[8px] font-bold uppercase tracking-[0.18em] text-brand-text"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const summary = month.days[cell.dateKey];
          const isSelected = cell.dateKey === selectedDateKey;
          const isToday = cell.dateKey === today;

          return (
            <Link
              key={cell.dateKey}
              href={`/admin/production?month=${month.monthKey}&date=${cell.dateKey}`}
              className={`relative flex min-h-[92px] flex-col gap-1 border-b border-r border-brand-border p-2 transition-colors last:border-r-0 [&:nth-child(7n)]:border-r-0 ${
                isSelected
                  ? "bg-brand-dark text-brand-bg"
                  : cell.inMonth
                    ? "bg-brand-bg hover:bg-brand-card"
                    : "bg-brand-card/40 text-brand-muted hover:bg-brand-card"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`font-mono text-[10px] ${
                    isToday
                      ? isSelected
                        ? "font-bold text-brand-bg underline decoration-1 underline-offset-4"
                        : "font-bold text-brand-dark underline decoration-1 underline-offset-4"
                      : isSelected
                        ? "text-brand-bg/70"
                        : cell.inMonth
                          ? "text-brand-text"
                          : "text-brand-muted"
                  }`}
                >
                  {String(cell.day).padStart(2, "0")}
                </span>

                {summary && (
                  <span
                    className={`font-sans text-[7px] font-bold uppercase tracking-[0.12em] ${
                      isSelected ? "text-brand-bg/80" : "text-brand-text"
                    }`}
                  >
                    {summary.orderCount} ord
                  </span>
                )}
              </div>

              {summary ? (
                <>
                  {summary.highlights.map((highlight) => (
                    <span
                      key={highlight.name}
                      className={`truncate font-sans text-[9px] leading-tight ${
                        isSelected ? "text-brand-bg" : "text-brand-dark"
                      }`}
                    >
                      {highlight.name}
                      <span
                        className={
                          isSelected ? "text-brand-bg/70" : "text-brand-text"
                        }
                      >
                        {" "}
                        ×{highlight.quantity}
                      </span>
                    </span>
                  ))}

                  <span
                    className={`mt-auto inline-flex w-fit items-center gap-1 border px-1.5 py-0.5 font-sans text-[7px] font-bold uppercase tracking-[0.12em] ${
                      summary.allReady
                        ? isSelected
                          ? "border-brand-bg/40 text-brand-bg"
                          : "border-brand-border bg-brand-bg text-brand-text"
                        : isSelected
                          ? "border-brand-bg bg-brand-bg text-brand-dark"
                          : "border-brand-dark bg-brand-dark text-brand-bg"
                    }`}
                  >
                    {summary.allReady ? "Siap semua" : `${summary.itemCount} item`}
                  </span>
                </>
              ) : (
                cell.inMonth && (
                  <span className="mt-auto font-sans text-[7px] uppercase tracking-[0.12em] text-brand-muted">
                    Kosong
                  </span>
                )
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
