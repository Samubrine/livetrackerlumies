import { formatCompactNumber, formatPlacedAt, formatRelativeAge, formatSignedCompactNumber, formatTimestampLabel } from "@/lib/formatters";
import type { ChartPoint, DashboardMetrics, LiveMetricCard, NotificationFeedItem, OrderRecord, TimeRangeOption } from "@/lib/types/domain";
import type { Tables } from "@/lib/types/database";

type OrderRow = Tables<"orders">;
type SnapshotRow = Tables<"market_snapshots">;
type NotificationRow = Tables<"notifications">;

const rangeMsMap: Record<TimeRangeOption, number> = {
  "30s": 30 * 1000,
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "3h": 3 * 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
};

export function mapOrderRecord(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    placedAt: formatPlacedAt(row.placed_at),
    askPrice: row.ask_price,
    originalQuantity: row.original_quantity,
    estimatedFilledQuantity: row.estimated_filled_quantity,
    predictedFilledQuantity: row.predicted_filled_quantity,
    remainingQuantity: row.remaining_quantity,
    status: row.status as OrderRecord["status"],
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapNotificationFeedItem(row: NotificationRow): NotificationFeedItem {
  return {
    id: row.id,
    title: row.notification_type.replace(/_/g, " "),
    message: row.message,
    triggeredAt: formatTimestampLabel(row.triggered_at),
  };
}

export function calculateDashboardMetrics(
  orders: OrderRow[],
  latestSnapshot: SnapshotRow | null,
): DashboardMetrics {
  const bestBuy = latestSnapshot?.best_buy_price ?? null;
  const bestSell = latestSnapshot?.best_sell_price ?? null;

  const realizedPnl = orders.reduce((sum, order) => {
    if (bestBuy === null) {
      return sum;
    }

    return sum + order.estimated_filled_quantity * (order.ask_price - bestBuy);
  }, 0);

  const unrealizedPnl = orders.reduce((sum, order) => {
    if (bestBuy === null || order.remaining_quantity <= 0) {
      return sum;
    }

    return sum + order.remaining_quantity * (order.ask_price - bestBuy);
  }, 0);

  const predictedFillQuantity = orders.reduce(
    (sum, order) => sum + order.predicted_filled_quantity,
    0,
  );

  const activeOrders = orders.filter((order) => order.status !== "closed").length;

  return {
    realizedPnl,
    unrealizedPnl,
    predictedFillQuantity,
    activeOrders,
    lastMarketUpdate: latestSnapshot?.captured_at ?? null,
    bestBuyPrice: bestBuy,
    bestSellPrice: bestSell,
    movingWeek: latestSnapshot?.moving_week ?? null,
  };
}

export function buildMetricCards(metrics: DashboardMetrics): LiveMetricCard[] {
  return [
    {
      label: "Realized PnL",
      value: formatSignedCompactNumber(metrics.realizedPnl),
      tone: metrics.realizedPnl >= 0 ? "positive" : "negative",
      detail: "Confirmed fills marked against the current best-buy baseline.",
    },
    {
      label: "Unrealized PnL",
      value: formatSignedCompactNumber(metrics.unrealizedPnl),
      tone: metrics.unrealizedPnl >= 0 ? "positive" : "negative",
      detail: "Remaining quantity repriced versus the latest best buy.",
    },
    {
      label: "Predicted fills",
      value: formatCompactNumber(metrics.predictedFillQuantity),
      tone: "accent",
      detail: `${metrics.activeOrders} active shared orders still waiting in the queue.`,
    },
    {
      label: "Market pulse",
      value: formatRelativeAge(metrics.lastMarketUpdate),
      tone: "neutral",
      detail:
        metrics.bestBuyPrice === null
          ? "Waiting for the first ENCHANTED_SEA_LUMIE snapshot."
          : `Best buy ${formatCompactNumber(metrics.bestBuyPrice)} / best sell ${formatCompactNumber(metrics.bestSellPrice ?? 0)}.`,
    },
  ];
}

export function buildChartPoints(
  snapshots: SnapshotRow[],
  orders: OrderRow[],
  range: TimeRangeOption,
): ChartPoint[] {
  const now = Date.now();
  const cutoff = now - rangeMsMap[range];
  const activeOrders = orders.filter((order) => order.status !== "closed");
  const activeAskPrice = activeOrders.length
    ? activeOrders.reduce((sum, order) => sum + order.ask_price, 0) / activeOrders.length
    : 0;
  const confirmedFillQuantity = orders.reduce(
    (sum, order) => sum + order.estimated_filled_quantity,
    0,
  );
  const remainingQuantity = orders.reduce((sum, order) => sum + order.remaining_quantity, 0);
  const predictedFillQuantity = orders.reduce(
    (sum, order) => sum + order.predicted_filled_quantity,
    0,
  );

  return snapshots
    .filter((snapshot) => new Date(snapshot.captured_at).getTime() >= cutoff)
    .map((snapshot) => ({
      timestamp: formatTimestampLabel(snapshot.captured_at),
      bestBuyPrice: snapshot.best_buy_price,
      askPrice: activeAskPrice,
      realizedPnl: confirmedFillQuantity * (activeAskPrice - snapshot.best_buy_price),
      unrealizedPnl: remainingQuantity * (activeAskPrice - snapshot.best_buy_price),
      predictedFillQuantity,
    }));
}
