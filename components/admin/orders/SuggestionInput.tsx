"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

export type SuggestionOption = {
  /** Nilai yang diisikan ke input saat saran dipilih. */
  value: string;
  /** Teks utama di daftar saran (default: `value`). */
  label?: string;
  /** Teks kecil di kanan, mis. no. HP atau jumlah pesanan. */
  meta?: string;
};

type SuggestionInputProps<T extends SuggestionOption> = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: T[];
  /** Dipanggil setelah saran dipilih (mis. untuk mengisi field lain). */
  onPick?: (option: T) => void;
  placeholder?: string;
  required?: boolean;
};

type SuggestionInputComponent = <T extends SuggestionOption>(
  props: SuggestionInputProps<T>,
) => React.ReactElement;

const fieldClass =
  "w-full border border-brand-border bg-brand-bg px-3.5 py-3 pr-10 font-sans text-xs text-brand-dark outline-none transition-colors placeholder:text-brand-muted focus:border-brand-dark";

/**
 * Input teks dengan saran otomatis (bukan select): pengguna tetap bisa mengetik
 * bebas, saran hanya membantu memilih nilai yang sudah pernah dipakai.
 */
const SuggestionInput: SuggestionInputComponent = ({
  id,
  value,
  onChange,
  suggestions,
  onPick,
  placeholder,
  required,
}) => {
  const listId = `${id}-suggestions`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const filtered = useMemo(() => {
    const needle = value.trim().toLowerCase();

    if (!needle) return suggestions;

    return suggestions.filter((option) =>
      `${option.label ?? option.value} ${option.meta ?? ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [suggestions, value]);

  const showList = open && filtered.length > 0;

  // Tutup daftar saran saat klik di luar field.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function closeList() {
    setOpen(false);
    setHighlight(-1);
  }

  function selectOption(option: SuggestionOption) {
    onChange(option.value);
    onPick?.(option as never);
    closeList();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (filtered.length === 0) return;

      setOpen(true);
      setHighlight((current) => {
        const next = event.key === "ArrowDown" ? current + 1 : current - 1;

        if (next < 0) return filtered.length - 1;
        if (next >= filtered.length) return 0;

        return next;
      });

      return;
    }

    if (event.key === "Enter" && showList && highlight >= 0) {
      event.preventDefault();
      selectOption(filtered[highlight]);
      return;
    }

    if (event.key === "Escape") {
      closeList();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        required={required}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-activedescendant={
          showList && highlight >= 0 ? `${listId}-${highlight}` : undefined
        }
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={fieldClass}
      />

      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            closeList();
          }}
          aria-label="Kosongkan isian"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand-muted transition-colors hover:text-brand-dark"
        >
          <X size={13} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Tutup pilihan" : "Buka pilihan"}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand-muted transition-colors hover:text-brand-dark"
        >
          <ChevronDown size={13} />
        </button>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto border border-brand-border bg-brand-bg shadow-[0_10px_30px_rgba(28,27,25,0.08)]"
        >
          {filtered.map((option, index) => (
            <li
              key={`${option.value}::${option.meta ?? ""}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === highlight}
              onMouseDown={(event) => {
                // Cegah input kehilangan fokus sebelum nilai dipilih.
                event.preventDefault();
                selectOption(option);
              }}
              onMouseEnter={() => setHighlight(index)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 transition-colors ${
                index === highlight ? "bg-brand-card" : ""
              }`}
            >
              <span className="truncate font-sans text-[11px] text-brand-dark">
                {option.label ?? option.value}
              </span>
              {option.meta && (
                <span className="shrink-0 font-mono text-[9px] text-brand-muted">
                  {option.meta}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SuggestionInput;
