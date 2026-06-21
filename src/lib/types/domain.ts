export type OrderStatus = "open" | "partial" | "closed";

export type OrderRecord = {
  id: string;
  placedAt: string;
  askPrice: number;
  originalQuantity: number;
  estimatedFilledQuantity: number;
  predictedFilledQuantity: number;
  remainingQuantity: number;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LiveMetricCard = {
  label: string;
  value: string;
  tone: "neutral" | "positive" | "negative" | "accent";
  detail: string;
};

export type DashboardMetrics = {
  realizedPnl: number;
  unrealizedPnl: number;
  predictedFillQuantity: number;
  activeOrders: number;
  lastMarketUpdate: string | null;
  bestBuyPrice: number | null;
  bestSellPrice: number | null;
  movingWeek: number | null;
};

export type TimeRangeOption =
  | "30s"
  | "1m"
  | "5m"
  | "15m"
  | "1h"
  | "3h"
  | "6h"
  | "12h"
  | "1d"
  | "3d"
  | "1w";

export type ChartPoint = {
  timestamp: string;
  bestBuyPrice: number;
  askPrice: number;
  realizedPnl: number;
  unrealizedPnl: number;
  predictedFillQuantity: number;
};

export type NotificationFeedItem = {
  id: string;
  title: string;
  message: string;
  triggeredAt: string;
};
