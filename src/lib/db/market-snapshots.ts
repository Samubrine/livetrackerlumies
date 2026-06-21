import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesInsert } from "@/lib/types/database";

export async function insertMarketSnapshot(snapshot: TablesInsert<"market_snapshots">) {
  const supabase = createSupabaseAdminClient();

  const result = await supabase
    .from("market_snapshots")
    .insert(snapshot)
    .select("*")
    .single();

  if (result.error) {
    throw new Error(`Failed to insert market snapshot: ${result.error.message}`);
  }

  return result.data;
}

export async function getSnapshotById(snapshotId: string) {
  const supabase = createSupabaseAdminClient();

  const result = await supabase
    .from("market_snapshots")
    .select("*")
    .eq("id", snapshotId)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Failed to fetch snapshot: ${result.error.message}`);
  }

  return result.data as Tables<"market_snapshots"> | null;
}
