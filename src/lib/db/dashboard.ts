import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TimeRangeOption } from "@/lib/types/domain";

const rangeHoursMap: Record<TimeRangeOption, number> = {
  "30s": 1,
  "1m": 1,
  "5m": 2,
  "15m": 6,
  "1h": 24,
  "3h": 48,
  "6h": 72,
  "12h": 96,
  "1d": 168,
  "3d": 168,
  "1w": 168,
};

export async function getLatestSnapshot() {
  const supabase = createSupabaseAdminClient();
  const result = await supabase
    .from("market_snapshots")
    .select("*")
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Failed to fetch latest snapshot: ${result.error.message}`);
  }

  return result.data;
}

export async function listSnapshotsForRange(range: TimeRangeOption) {
  const supabase = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() - rangeHoursMap[range] * 60 * 60 * 1000).toISOString();

  const result = await supabase
    .from("market_snapshots")
    .select("*")
    .gte("captured_at", cutoff)
    .order("captured_at", { ascending: true })
    .limit(500);

  if (result.error) {
    throw new Error(`Failed to fetch chart snapshots: ${result.error.message}`);
  }

  return result.data;
}
