import { listSnapshotsForRange } from "@/lib/db/dashboard";
import { listOrders } from "@/lib/db/orders";
import { buildChartPoints } from "@/lib/dashboard";
import type { TimeRangeOption } from "@/lib/types/domain";

const allowedRanges = new Set<TimeRangeOption>([
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
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") as TimeRangeOption | null;
  const selectedRange = range && allowedRanges.has(range) ? range : "15m";

  const [orders, snapshots] = await Promise.all([
    listOrders(),
    listSnapshotsForRange(selectedRange),
  ]);

  return Response.json({
    range: selectedRange,
    points: buildChartPoints(snapshots, orders, selectedRange),
  });
}
