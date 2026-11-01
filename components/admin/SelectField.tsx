import { ChevronDown } from "lucide-react";

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  /** Ukuran ikon chevron (px). */
  iconSize?: number;
  /** Posisi & warna chevron, mis. `right-1.5 text-brand-dark`. */
  iconClassName?: string;
};

/**
 * Select dengan chevron custom: panah bawaan browser disembunyikan
 * (`appearance-none`) supaya jaraknya ke tepi kanan konsisten di semua
 * browser/OS. Beri `pr-*` pada `className` untuk ruang chevron.
 */
export default function SelectField({
  iconSize = 14,
  iconClassName = "right-3 text-brand-text",
  className = "",
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className="relative">
      <select {...props} className={`appearance-none ${className}`}>
        {children}
      </select>

      <ChevronDown
        size={iconSize}
        strokeWidth={1.7}
        aria-hidden
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${iconClassName}`}
      />
    </div>
  );
}
