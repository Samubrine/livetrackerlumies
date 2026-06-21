import { ChartPlaceholder } from "@/components/dashboard/chart-placeholder";
import { HeadlineCards } from "@/components/dashboard/headline-cards";
import { NotificationsFeed } from "@/components/dashboard/notifications-feed";
import { OrderFormPlaceholder } from "@/components/dashboard/order-form-placeholder";
import { OrdersTable } from "@/components/dashboard/orders-table";
import type {
  ChartPoint,
  LiveMetricCard,
  NotificationFeedItem,
  OrderRecord,
  TimeRangeOption,
} from "@/lib/types/domain";

const metricCards: LiveMetricCard[] = [
  {
    label: "Realized PnL",
    value: "+1.82M",
    tone: "positive",
    detail: "Confirmed fills only. Predictions never touch this number.",
  },
  {
    label: "Unrealized PnL",
    value: "-420K",
    tone: "negative",
    detail: "Remaining listed inventory repriced against the live best buy.",
  },
  {
    label: "Predicted fills",
    value: "18.4K",
    tone: "accent",
    detail: "Queue-regression estimate at the active ask level.",
  },
  {
    label: "Market pulse",
    value: "15s",
    tone: "neutral",
    detail: "Target snapshot cadence for the ingestion worker.",
  },
];

const sampleOrders: OrderRecord[] = [
  {
    id: "1",
    placedAt: "2026-06-21 10:35 UTC",
    askPrice: 1480,
    originalQuantity: 54000,
    estimatedFilledQuantity: 22000,
    predictedFilledQuantity: 9000,
    remainingQuantity: 32000,
    status: "partial",
    note: "Shared ladder near peak morning demand",
    createdAt: "2026-06-21T10:35:00.000Z",
    updatedAt: "2026-06-21T10:47:00.000Z",
  },
  {
    id: "2",
    placedAt: "2026-06-21 10:41 UTC",
    askPrice: 1476,
    originalQuantity: 18000,
    estimatedFilledQuantity: 0,
    predictedFilledQuantity: 3400,
    remainingQuantity: 18000,
    status: "open",
    note: "Watching for downside pressure from best buy fade",
    createdAt: "2026-06-21T10:41:00.000Z",
    updatedAt: "2026-06-21T10:49:00.000Z",
  },
  {
    id: "3",
    placedAt: "2026-06-21 09:58 UTC",
    askPrice: 1468,
    originalQuantity: 12000,
    estimatedFilledQuantity: 12000,
    predictedFilledQuantity: 0,
    remainingQuantity: 0,
    status: "closed",
    note: "Closed after buy wall broke",
    createdAt: "2026-06-21T09:58:00.000Z",
    updatedAt: "2026-06-21T10:16:00.000Z",
  },
];

const notifications: NotificationFeedItem[] = [
  {
    id: "n1",
    title: "Order 1476 got overtaken",
    message:
      "Best buy slipped again while the order stayed posted. Opportunity loss is widening for the remaining 18K volume.",
    triggeredAt: "10:49 UTC",
  },
  {
    id: "n2",
    title: "1480 level confirmed fills",
    message:
      "Best sell moved through the tracked ladder and confirmed another 8K quantity as realized.",
    triggeredAt: "10:45 UTC",
  },
];

const chartRanges: TimeRangeOption[] = [
  "30s",
  "1m",
  "5m",
  "15m",
  "1h",
  "3h",
  "6h",
  "12h",
  "1d",
  "3d",
  "1w",
];

const chartPoints: ChartPoint[] = [
  {
    timestamp: "10:00",
    bestBuyPrice: 1460,
    askPrice: 1472,
    realizedPnl: 320000,
    unrealizedPnl: -120000,
    predictedFillQuantity: 1500,
  },
  {
    timestamp: "10:15",
    bestBuyPrice: 1464,
    askPrice: 1478,
    realizedPnl: 490000,
    unrealizedPnl: -80000,
    predictedFillQuantity: 4200,
  },
  {
    timestamp: "10:30",
    bestBuyPrice: 1470,
    askPrice: 1480,
    realizedPnl: 960000,
    unrealizedPnl: -180000,
    predictedFillQuantity: 7200,
  },
  {
    timestamp: "10:45",
    bestBuyPrice: 1468,
    askPrice: 1476,
    realizedPnl: 1820000,
    unrealizedPnl: -420000,
    predictedFillQuantity: 18400,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.18),_transparent_24%),linear-gradient(180deg,_#19130e_0%,_#120f0d_45%,_#09090b_100%)] text-stone-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 px-6 py-8 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:px-8 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-200/80">
                Hypixel SkyBlock - shared Sea Lumies desk
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-5xl lg:text-6xl">
                Track listing pain in real time, not just filled profits.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-stone-300 sm:text-lg">
                A single shared ledger for Sea Lumies sell orders, with live best-buy repricing,
                strict realized versus unrealized PnL, and a separate prediction layer for fills.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 text-sm text-stone-300 sm:grid-cols-2 lg:min-w-[360px]">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Feed mode</p>
                <p className="mt-2 text-lg font-semibold text-stone-50">Best-effort 15s snapshots</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">PnL baseline</p>
                <p className="mt-2 text-lg font-semibold text-stone-50">Best buy price</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Why this exists</p>
                <p className="mt-2 text-stone-300">
                  Surface opportunity loss when supply sits on the ask and the market starts to roll
                  over underneath it.
                </p>
              </div>
            </div>
          </div>
        </section>

        <HeadlineCards cards={metricCards} />

        <div className="grid gap-8 xl:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-8">
            <ChartPlaceholder
              points={chartPoints}
              activeRange="15m"
              availableRanges={chartRanges}
            />
            <OrdersTable orders={sampleOrders} />
          </div>

          <div className="space-y-8">
            <OrderFormPlaceholder />
            <NotificationsFeed items={notifications} />
          </div>
        </div>
      </div>
    </main>
  );
}
