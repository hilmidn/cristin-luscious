"use client";

import { useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { setProductionProductStage } from "@/app/admin/(panel)/production/actions";
import {
  nextStage,
  previousStage,
  PRODUCTION_STAGE_LABELS,
  PRODUCTION_STAGES,
  stageIndex,
  type ProductionStage,
} from "@/lib/production-types";

type ProductionStageStepperProps = {
  /** Semua task dari seluruh varian satu produk pada tanggal yang sama. */
  taskIds: string[];
  stage: ProductionStage;
};

export default function ProductionStageStepper({
  taskIds,
  stage,
}: ProductionStageStepperProps) {
  const [isPending, startTransition] = useTransition();
  const current = stageIndex(stage);
  const next = nextStage(stage);
  const previous = previousStage(stage);

  function move(direction: "next" | "prev") {
    const target = direction === "next" ? next : previous;

    if (!target) {
      return;
    }

    startTransition(async () => {
      const result = await setProductionProductStage(taskIds, target);

      if (!result.ok) {
        window.alert(result.error);
      }
    });
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-brand-text">
          Tahap {current + 1}/{PRODUCTION_STAGES.length}
        </span>
        <span className="truncate font-sans text-[8px] font-bold uppercase tracking-[0.12em] text-brand-text">
          {next
            ? `Berikutnya: ${PRODUCTION_STAGE_LABELS[next]}`
            : "Tahap akhir"}
        </span>
      </div>

      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => move("prev")}
          disabled={isPending || !previous}
          aria-label="Kembali ke tahap sebelumnya"
          className="flex w-8 shrink-0 items-center justify-center border border-brand-border bg-brand-bg text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/* Nama tahap aktif: bar gelap selebar kartu, tidak pernah terpotong. */}
          <div
            className={`flex h-8 items-center justify-center px-2 ${
              isPending ? "bg-brand-text" : "bg-brand-dark"
            }`}
          >
            <span className="whitespace-nowrap font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-brand-bg">
              {PRODUCTION_STAGE_LABELS[stage]}
            </span>
          </div>

          <div
            className="flex gap-1"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={PRODUCTION_STAGES.length}
            aria-valuenow={current + 1}
            aria-valuetext={PRODUCTION_STAGE_LABELS[stage]}
          >
            {PRODUCTION_STAGES.map((item, index) => (
              <span
                key={item}
                title={PRODUCTION_STAGE_LABELS[item]}
                className={`h-[3px] flex-1 ${
                  index < current
                    ? "bg-brand-dark"
                    : index === current
                      ? "bg-brand-text"
                      : "bg-brand-border"
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => move("next")}
          disabled={isPending || !next}
          aria-label="Lanjut ke tahap berikutnya"
          className="flex w-8 shrink-0 items-center justify-center border border-brand-dark bg-brand-dark text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-30"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
