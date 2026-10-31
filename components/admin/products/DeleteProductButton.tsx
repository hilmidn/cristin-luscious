"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/admin/(panel)/products/actions";

type DeleteProductButtonProps = {
  id: string;
  name: string;
};

export default function DeleteProductButton({
  id,
  name,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm(
      `Hapus produk "${name}" beserta semua variannya? Tindakan ini tidak bisa dibatalkan.`,
    );

    if (!confirmed) return;

    setError(null);

    startTransition(async () => {
      const result = await deleteProduct(id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-2 border border-brand-border px-4 py-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-text transition-colors hover:border-brand-dark hover:text-brand-dark disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Trash2 size={12} />
        )}
        Hapus Produk
      </button>

      {error && (
        <p className="mt-2 font-sans text-[10px] text-brand-dark">{error}</p>
      )}
    </div>
  );
}
