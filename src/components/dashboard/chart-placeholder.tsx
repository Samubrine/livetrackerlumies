import type { ChartPoint, TimeRangeOption } from "@/lib/types/domain";

type ChartPlaceholderProps = {
  points: ChartPoint[];
  activeRange: TimeRangeOption;
  availableRanges: TimeRangeOption[];
};

export function ChartPlaceholder({
  points,
  activeRange,
  availableRanges,
}: ChartPlaceholderProps) {
  const latest = points.at(-1);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-stone-950/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
            Market + pnl
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-50">Live overview chart</h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-400">
            Raw Supabase snapshots are now feeding this view. Next, the interactive chart will swap
            in with real timeframe controls and live subscriptions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableRanges.map((range) => (
            <span
              key={range}
              className={`rounded-full px-3 py-1 text-xs ${
                range === activeRange
                  ? "bg-amber-300 text-stone-950"
                  : "border border-white/10 bg-white/5 text-stone-300"
              }`}
            >
              {range}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/10 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] p-6">
        <div className="grid gap-4 md:grid-cols-5">
          <MetricPreview label="Best buy" value={latest?.bestBuyPrice ?? 0} />
          <MetricPreview label="Ask level" value={latest?.askPrice ?? 0} />
          <MetricPreview label="Realized" value={latest?.realizedPnl ?? 0} />
          <MetricPreview label="Unrealized" value={latest?.unrealizedPnl ?? 0} />
          <MetricPreview
            label="Predicted fill"
            value={latest?.predictedFillQuantity ?? 0}
          />
        </div>
        <div className="mt-6 h-64 rounded-[1.5rem] border border-white/10 bg-stone-900/70 p-4">
          {points.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-stone-400">
              No snapshots yet for this timeframe. Trigger `/api/ingest` again and refresh.
            </div>
          ) : (
            <div className="flex h-full items-end gap-2">
              {points.map((point) => (
                <div key={point.timestamp} className="flex h-full flex-1 items-end gap-1">
                  <div
                    className="w-full rounded-t-full bg-sky-300/70"
                    style={{ height: `${Math.max(point.bestBuyPrice / 18, 8)}%` }}
                  />
                  <div
                    className="w-full rounded-t-full bg-amber-300/70"
                    style={{ height: `${Math.max(point.askPrice / 18, 8)}%` }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MetricPreview({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-stone-50">{value.toLocaleString()}</p>
    </div>
  );
}
