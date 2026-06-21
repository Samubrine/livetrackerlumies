"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";

type OrderFormProps = {
  defaultPlacedAt: string;
};

type FormState = {
  placedAt: string;
  askPrice: string;
  originalQuantity: string;
  estimatedFilledQuantity: string;
  predictedFilledQuantity: string;
  note: string;
};

const initialFormState = (defaultPlacedAt: string): FormState => ({
  placedAt: defaultPlacedAt,
  askPrice: "",
  originalQuantity: "",
  estimatedFilledQuantity: "0",
  predictedFilledQuantity: "0",
  note: "",
});

export function OrderForm({ defaultPlacedAt }: OrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(initialFormState(defaultPlacedAt));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = {
      placedAt: formState.placedAt,
      askPrice: Number(formState.askPrice),
      originalQuantity: Number(formState.originalQuantity),
      estimatedFilledQuantity: Number(formState.estimatedFilledQuantity || "0"),
      predictedFilledQuantity: Number(formState.predictedFilledQuantity || "0"),
      note: formState.note.trim() || null,
    };

    startTransition(async () => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Failed to create order.");
        return;
      }

      setFormState(initialFormState(new Date().toISOString().slice(0, 16)));
      router.refresh();
    });
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-stone-950/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm xl:h-full xl:min-h-0 xl:overflow-auto">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
        Shared entry
      </p>
      <h2 className="mt-2 text-xl font-semibold text-stone-50">Add shared order</h2>
      <p className="mt-3 max-w-xl text-sm text-stone-400">
        Post a shared ENCHANTED SEA LUMIE sell order directly into the global ledger. Everyone on
        the page sees the same record set.
      </p>

      <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Placed at (UTC)">
            <input
              className={inputClassName}
              type="datetime-local"
              value={formState.placedAt}
              onChange={(event) => updateField("placedAt", event.target.value)}
              required
            />
          </Field>
          <Field label="Ask price">
            <input
              className={inputClassName}
              type="number"
              min="0"
              step="0.01"
              value={formState.askPrice}
              onChange={(event) => updateField("askPrice", event.target.value)}
              placeholder="1480"
              required
            />
          </Field>
          <Field label="Original quantity">
            <input
              className={inputClassName}
              type="number"
              min="0.0001"
              step="1"
              value={formState.originalQuantity}
              onChange={(event) => updateField("originalQuantity", event.target.value)}
              placeholder="54000"
              required
            />
          </Field>
          <Field label="Confirmed fill">
            <input
              className={inputClassName}
              type="number"
              min="0"
              step="1"
              value={formState.estimatedFilledQuantity}
              onChange={(event) => updateField("estimatedFilledQuantity", event.target.value)}
            />
          </Field>
          <Field label="Predicted fill">
            <input
              className={inputClassName}
              type="number"
              min="0"
              step="1"
              value={formState.predictedFilledQuantity}
              onChange={(event) => updateField("predictedFilledQuantity", event.target.value)}
            />
          </Field>
          <Field label="Quick note">
            <input
              className={inputClassName}
              type="text"
              value={formState.note}
              onChange={(event) => updateField("note", event.target.value)}
              placeholder="Morning ladder"
            />
          </Field>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <button
          className="mt-1 inline-flex h-12 items-center justify-center rounded-2xl bg-amber-300 px-5 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Saving order..." : "Add order"}
        </button>
      </form>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.2em] text-stone-400">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "h-12 rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300/50 focus:bg-white/[0.08]";
