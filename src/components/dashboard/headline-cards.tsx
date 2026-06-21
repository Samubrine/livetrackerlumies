import clsx from "clsx";

import type { LiveMetricCard } from "@/lib/types/domain";

const toneStyles: Record<LiveMetricCard["tone"], string> = {
  neutral: "border-white/10 bg-white/5 text-stone-100",
  positive: "border-emerald-400/30 bg-emerald-500/10 text-emerald-50",
  negative: "border-rose-400/30 bg-rose-500/10 text-rose-50",
  accent: "border-amber-300/30 bg-amber-300/10 text-amber-50",
};

type HeadlineCardsProps = {
  cards: LiveMetricCard[];
};

export function HeadlineCards({ cards }: HeadlineCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className={clsx(
            "rounded-3xl border p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm",
            toneStyles[card.tone],
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-300/90">
            {card.label}
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight">{card.value}</p>
          <p className="mt-2 text-sm text-stone-300/80">{card.detail}</p>
        </article>
      ))}
    </section>
  );
}
