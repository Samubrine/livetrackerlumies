import { getLatestSnapshot, listSnapshotsForRange } from "@/lib/db/dashboard";
import { listNotifications } from "@/lib/db/notifications";
import { listOrders } from "@/lib/db/orders";
import {
  buildChartPoints,
  buildMetricCards,
  calculateDashboardMetrics,
  mapNotificationFeedItem,
  mapOrderRecord,
} from "@/lib/dashboard";
import { LiveDashboard } from "@/components/dashboard/live-dashboard";
import type { DashboardPayload, TimeRangeOption } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

export default async function Home() {
  const activeRange: TimeRangeOption = "15m";
  let initialPayload: DashboardPayload = {
    cards: buildMetricCards(calculateDashboardMetrics([], null)),
    orders: [],
    notifications: [],
    points: [],
    activeRange,
  };

  try {
    const [orders, notifications, latestSnapshot, chartSnapshots] = await Promise.all([
      listOrders(),
      listNotifications(),
      getLatestSnapshot(),
      listSnapshotsForRange(activeRange),
    ]);

    const metrics = calculateDashboardMetrics(orders, latestSnapshot);
    initialPayload = {
      cards: buildMetricCards(metrics),
      orders: orders.map(mapOrderRecord),
      notifications: notifications.map(mapNotificationFeedItem),
      points: buildChartPoints(chartSnapshots, orders, activeRange),
      activeRange,
    };
  } catch {
    initialPayload = {
      cards: [
        {
          label: "Connection",
          value: "Offline",
          tone: "negative",
          detail: "Supabase data was unavailable during this request.",
        },
        {
          label: "Orders",
          value: "0",
          tone: "neutral",
          detail: "Waiting for a successful database connection.",
        },
        {
          label: "Snapshots",
          value: "0",
          tone: "neutral",
          detail: "Run ingest again after the deployment environment is ready.",
        },
        {
          label: "Status",
          value: "Retry",
          tone: "accent",
          detail: "The page will recover automatically on the next successful request.",
        },
      ],
      orders: [],
      notifications: [],
      points: [],
      activeRange,
    };
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.18),_transparent_24%),linear-gradient(180deg,_#19130e_0%,_#120f0d_45%,_#09090b_100%)] text-stone-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 px-5 py-6 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:px-8 lg:px-10 lg:py-8 xl:shrink-0">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80">
                Hypixel SkyBlock - shared ENCHANTED SEA LUMIE desk
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl lg:text-6xl">
                Track listing pain in real time, not just filled profits.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-300 sm:text-lg">
                A single shared ledger for ENCHANTED SEA LUMIE sell orders, with live best-buy
                repricing, strict realized versus unrealized PnL, and a separate prediction layer
                for fills.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 text-sm text-stone-300 sm:grid-cols-2 lg:min-w-[360px]">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Feed mode</p>
                <p className="mt-2 text-lg font-semibold text-stone-50">Vercel + Supabase live feed</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">PnL baseline</p>
                <p className="mt-2 text-lg font-semibold text-stone-50">Best buy price</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Why this exists</p>
                <p className="mt-2 text-stone-300">
                  Surface opportunity loss when ENCHANTED SEA LUMIE supply sits on the ask and the
                  market starts to roll over underneath it.
                </p>
              </div>
            </div>
          </div>
        </section>

        <LiveDashboard initialPayload={initialPayload} />
      </div>
    </main>
  );
}
