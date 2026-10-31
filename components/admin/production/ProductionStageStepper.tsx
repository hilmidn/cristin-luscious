"use client";

import { useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { moveProductionStage } from "@/app/admin/(panel)/production/actions";
import {
  nextStage,
  previousStage,
  PRODUCTION_STAGE_LABELS,
  PRODUCTION_STAGES,
  stageIndex,
  type ProductionStage,
} from "@/lib/production-types";

type ProductionStageStepperProps = {
  taskId: string;
  stage: ProductionStage;
};

export default function ProductionStageStepper({
  taskId,
  stage,
}: ProductionStageStepperProps) {
  const [isPending, startTransition] = useTransition();
  const current = stageIndex(stage);

  function move(direction: "next" | "prev") {
    startTransition(async () => {
      const result = await moveProductionStage(taskId, direction);

      if (!result.ok) {
        window.alert(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => move("prev")}
        disabled={isPending || !previousStage(stage)}
        aria-label="Kembali ke tahap sebelumnya"
        className="flex h-7 w-7 shrink-0 items-center justify-center border border-brand-border bg-brand-bg text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft size={13} />
      </button>

      <div className="flex min-w-0 flex-1 items-start gap-1">
        {PRODUCTION_STAGES.map((item, index) => {
          const reached = index <= current;
          const active = index === current;

          return (
            <div key={item} className="min-w-0 flex-1">
              <div
                className={`h-[3px] w-full ${
                  reached ? "bg-brand-dark" : "bg-brand-border"
                }`}
              />
              <span
                className={`mt-1 block truncate font-sans text-[7px] uppercase tracking-[0.12em] ${
                  active
                    ? "font-bold text-brand-dark"
                    : reached
                      ? "text-brand-text"
                      : "text-brand-muted"
                }`}
              >
                {PRODUCTION_STAGE_LABELS[item]}
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => move("next")}
        disabled={isPending || !nextStage(stage)}
        aria-label="Lanjut ke tahap berikutnya"
        className="flex h-7 w-7 shrink-0 items-center justify-center border border-brand-dark bg-brand-dark text-brand-bg transition-colors hover:bg-transparent hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-30"
      >
        {isPending ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <ChevronRight size={13} />
        )}
      </button>
    </div>
  );
}
