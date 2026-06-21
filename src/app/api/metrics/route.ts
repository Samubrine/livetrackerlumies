import { getLatestSnapshot } from "@/lib/db/dashboard";
import { listOrders } from "@/lib/db/orders";
import { buildMetricCards, calculateDashboardMetrics } from "@/lib/dashboard";

export async function GET() {
  const [orders, latestSnapshot] = await Promise.all([listOrders(), getLatestSnapshot()]);
  const metrics = calculateDashboardMetrics(orders, latestSnapshot);

  return Response.json({
    metrics,
    cards: buildMetricCards(metrics),
  });
}
