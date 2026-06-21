"use client";

import { useState, useTransition } from "react";

import type { OrderRecord } from "@/lib/types/domain";

type OrdersTableProps = {
  orders: OrderRecord[];
  onDeleted?: () => Promise<void> | void;
};

const statusStyles: Record<OrderRecord["status"], string> = {
  open: "bg-sky-400/15 text-sky-100 ring-sky-300/20",
  partial: "bg-amber-300/15 text-amber-50 ring-amber-200/20",
  closed: "bg-emerald-400/15 text-emerald-100 ring-emerald-300/20",
};

export function OrdersTable({ orders, onDeleted }: OrdersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleDelete(orderId: string) {
    const confirmed = window.confirm("Delete this shared order?");

    if (!confirmed) {
      return;
    }

    setDeletingId(orderId);
    startTransition(async () => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await onDeleted?.();
      }

      setDeletingId(null);
    });
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-stone-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm xl:h-full xl:min-h-0 xl:overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
            Shared ledger
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-50">Sea Lumies orders</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
          {orders.length} tracked orders
        </span>
      </div>

      <div className="mt-5 overflow-x-auto xl:h-[calc(100%-4.5rem)] xl:min-h-0 xl:overflow-auto">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-stone-400">
            No shared orders yet. Use `POST /api/orders` or the upcoming form to seed the first
            ledger entries.
          </div>
        ) : (
          <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm text-stone-200">
            <thead>
              <tr className="text-xs uppercase tracking-[0.24em] text-stone-500">
                <th className="pb-2 pr-4">Placed</th>
                <th className="pb-2 pr-4">Ask</th>
                <th className="pb-2 pr-4">Original Qty</th>
                <th className="pb-2 pr-4">Confirmed Fill</th>
                <th className="pb-2 pr-4">Predicted Fill</th>
                <th className="pb-2 pr-4">Remaining</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Note</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="rounded-2xl bg-white/[0.035]">
                  <td className="rounded-l-2xl px-4 py-4 text-stone-300">{order.placedAt}</td>
                  <td className="px-4 py-4">{order.askPrice.toLocaleString()}</td>
                  <td className="px-4 py-4">{order.originalQuantity.toLocaleString()}</td>
                  <td className="px-4 py-4">{order.estimatedFilledQuantity.toLocaleString()}</td>
                  <td className="px-4 py-4">{order.predictedFilledQuantity.toLocaleString()}</td>
                  <td className="px-4 py-4">{order.remainingQuantity.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="rounded-r-2xl px-4 py-4 text-stone-400">
                    {order.note ?? "-"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      className="rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      onClick={() => handleDelete(order.id)}
                      disabled={isPending && deletingId === order.id}
                    >
                      {isPending && deletingId === order.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
