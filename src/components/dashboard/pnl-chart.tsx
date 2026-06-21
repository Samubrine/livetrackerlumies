"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactNumber } from "@/lib/formatters";
import type { ChartPoint, TimeRangeOption } from "@/lib/types/domain";

type PnlChartProps = {
  points: ChartPoint[];
  activeRange: TimeRangeOption;
  availableRanges: TimeRangeOption[];
  onRangeChange?: (range: TimeRangeOption) => void;
};

export function PnlChart({
  points,
  activeRange,
  availableRanges,
  onRangeChange,
}: PnlChartProps) {
  const latest = points.at(-1);

  return (
    <section className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-stone-950/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm xl:h-full xl:min-h-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
            Market + pnl
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-50">Live overview chart</h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-400">
            The chart stays clipped to its container, scales with the device, and tracks market
            price plus session performance from Supabase snapshots.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableRanges.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => onRangeChange?.(range)}
              className={`rounded-full px-3 py-1 text-xs ${
                range === activeRange
                  ? "bg-amber-300 text-stone-950"
                  : "border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricPreview label="Best buy" value={latest?.bestBuyPrice ?? 0} />
        <MetricPreview label="Ask level" value={latest?.askPrice ?? 0} />
        <MetricPreview label="Realized" value={latest?.realizedPnl ?? 0} />
        <MetricPreview label="Unrealized" value={latest?.unrealizedPnl ?? 0} />
        <MetricPreview label="Predicted fill" value={latest?.predictedFillQuantity ?? 0} />
      </div>

      <div className="mt-5 min-w-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-stone-900/70 p-3 sm:p-4 xl:h-[calc(100%-10.5rem)] xl:min-h-[300px]">
        {points.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-stone-400 xl:h-full">
            No snapshots yet for this timeframe. Trigger `/api/ingest` again and refresh.
          </div>
        ) : (
          <div className="h-[260px] w-full min-w-0 xl:h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 12, right: 12, left: -18, bottom: 4 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fill: "#a8a29e", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tickFormatter={(value) => formatCompactNumber(Number(value))}
                  tick={{ fill: "#a8a29e", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={58}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(18, 18, 20, 0.96)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 18,
                    color: "#fafaf9",
                  }}
                  formatter={(value) => formatCompactNumber(Number(value ?? 0))}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="bestBuyPrice" stroke="#7dd3fc" strokeWidth={2.2} dot={false} name="Best buy" />
                <Line type="monotone" dataKey="askPrice" stroke="#fcd34d" strokeWidth={2.2} dot={false} name="Ask level" />
                <Line type="monotone" dataKey="realizedPnl" stroke="#34d399" strokeWidth={2} dot={false} name="Realized" />
                <Line type="monotone" dataKey="unrealizedPnl" stroke="#fb7185" strokeWidth={2} dot={false} name="Unrealized" />
                <Line type="monotone" dataKey="predictedFillQuantity" stroke="#c084fc" strokeWidth={1.8} dot={false} name="Predicted fill" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

function MetricPreview({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-stone-50">{formatCompactNumber(value)}</p>
    </div>
  );
}
