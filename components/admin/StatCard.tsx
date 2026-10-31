import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  index: string;
};

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  index,
}: StatCardProps) {
  return (
    <div className="group relative border border-brand-border bg-brand-card p-6 transition-colors duration-300 hover:border-brand-text">
      <div className="flex items-start justify-between gap-4">
        <span className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-brand-text">
          {label}
        </span>
        <Icon
          size={18}
          strokeWidth={1.4}
          className="shrink-0 text-brand-muted transition-colors duration-300 group-hover:text-brand-dark"
        />
      </div>

      <p className="mt-6 font-playfair text-4xl font-bold tracking-tight text-brand-dark md:text-5xl">
        {value}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-brand-border pt-3">
        <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-brand-text">
          {hint}
        </span>
        <span className="font-mono text-[9px] text-brand-muted">{index}</span>
      </div>
    </div>
  );
}
