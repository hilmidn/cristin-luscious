import {
  monthKeyLabel,
  ORDER_STATUS_LABELS,
  type OrderSourceOption,
  type OrderStatus,
} from "@/lib/order-types";
import SelectField from "@/components/admin/SelectField";

type OrderFiltersProps = {
  statuses: OrderStatus[];
  sources: OrderSourceOption[];
  params: {
    status?: string;
    source?: string;
    q?: string;
    month?: string;
  };
  /** Bila diisi, filter bulan tampil (dipakai halaman Rekap Pesanan). */
  months?: string[];
};

const fieldClass =
  "border border-brand-border bg-brand-bg px-3 py-2.5 font-sans text-[10px] text-brand-dark outline-none placeholder:text-brand-muted focus:border-brand-dark";

export default function OrderFilters({
  statuses,
  sources,
  params,
  months,
}: OrderFiltersProps) {
  const hasMonthFilter = Boolean(months?.length);

  return (
    <form
      method="get"
      className={`mb-6 grid grid-cols-1 gap-3 border border-brand-border bg-brand-card/40 p-4 sm:grid-cols-2 ${
        hasMonthFilter
          ? "lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
          : "sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
      }`}
    >
      {hasMonthFilter && (
        <SelectField
          name="month"
          defaultValue={params.month ?? "all"}
          aria-label="Filter bulan"
          className={`${fieldClass} w-full pr-9`}
        >
          <option value="all">Semua bulan</option>
          {months?.map((monthKey) => (
            <option key={monthKey} value={monthKey}>
              {monthKeyLabel(monthKey)}
            </option>
          ))}
        </SelectField>
      )}

      <SelectField
        name="status"
        defaultValue={params.status ?? ""}
        aria-label="Filter status"
        className={`${fieldClass} w-full pr-9`}
      >
        <option value="">Semua status</option>
        {statuses.map((status) => (
          <option key={status} value={status}>
            {ORDER_STATUS_LABELS[status]}
          </option>
        ))}
      </SelectField>

      <SelectField
        name="source"
        defaultValue={params.source ?? ""}
        aria-label="Filter sumber"
        className={`${fieldClass} w-full pr-9`}
      >
        <option value="">Semua sumber</option>
        {sources.map((option) => (
          <option key={option.source} value={option.source}>
            {option.source} ({option.count})
          </option>
        ))}
      </SelectField>

      <input
        name="q"
        defaultValue={params.q ?? ""}
        placeholder="Cari kode, nama, atau no. HP"
        aria-label="Cari pesanan"
        className={fieldClass}
      />

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 border border-brand-dark bg-brand-dark px-5 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark"
      >
        Terapkan
      </button>
    </form>
  );
}
