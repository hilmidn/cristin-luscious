"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrderStatus } from "@/app/admin/(panel)/orders/actions";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/order-types";

type OrderStatusControlProps = {
  id: string;
  status: OrderStatus;
};

export default function OrderStatusControl({
  id,
  status,
}: OrderStatusControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState<OrderStatus>(status);

  function handleChange(next: OrderStatus) {
    const previous = value;
    setValue(next);

    startTransition(async () => {
      const result = await setOrderStatus(id, next);

      if (!result.ok) {
        setValue(previous);
        window.alert(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <label className="inline-flex items-center gap-2 border border-brand-border bg-brand-card px-2.5 py-1.5">
      <span className="sr-only">Ubah status pesanan</span>
      <select
        value={value}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value as OrderStatus)}
        className="cursor-pointer bg-transparent font-sans text-[9px] font-bold uppercase tracking-[0.14em] text-brand-dark outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {ORDER_STATUSES.map((option) => (
          <option key={option} value={option}>
            {ORDER_STATUS_LABELS[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
