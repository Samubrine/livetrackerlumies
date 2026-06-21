import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/types/database";

export async function insertOrderFillEvent(event: TablesInsert<"order_fill_events">) {
  const supabase = createSupabaseAdminClient();

  const result = await supabase.from("order_fill_events").insert(event).select("id").single();

  if (result.error) {
    throw new Error(`Failed to create fill event: ${result.error.message}`);
  }

  return result.data;
}
