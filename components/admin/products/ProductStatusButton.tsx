"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { setProductPublished } from "@/app/admin/(panel)/products/actions";

type ProductStatusButtonProps = {
  id: string;
  published: boolean;
};

export default function ProductStatusButton({
  id,
  published,
}: ProductStatusButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await setProductPublished(id, !published);

          if (!result.ok) {
            window.alert(result.error);
          }
        })
      }
      className={`inline-flex items-center gap-2 border px-2.5 py-1.5 font-sans text-[8px] font-bold uppercase tracking-[0.16em] transition-colors disabled:opacity-60 ${
        published
          ? "border-brand-border bg-brand-card text-brand-dark hover:border-brand-dark"
          : "border-brand-dark bg-brand-dark text-brand-bg hover:bg-transparent hover:text-brand-dark"
      }`}
    >
      {isPending ? (
        <Loader2 size={10} className="animate-spin" />
      ) : published ? (
        <Eye size={10} />
      ) : (
        <EyeOff size={10} />
      )}
      {published ? "Aktif" : "Draft"}
    </button>
  );
}
