import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/types/database";

export async function listNotifications(limit = 10) {
  const supabase = createSupabaseAdminClient();

  const result = await supabase
    .from("notifications")
    .select("*")
    .order("triggered_at", { ascending: false })
    .limit(limit);

  if (result.error) {
    throw new Error(`Failed to list notifications: ${result.error.message}`);
  }

  return result.data;
}

export async function createNotificationIfAbsent(notification: TablesInsert<"notifications">) {
  const supabase = createSupabaseAdminClient();

  const result = await supabase
    .from("notifications")
    .upsert(notification, {
      onConflict: "order_id,notification_type",
      ignoreDuplicates: true,
    })
    .select("id");

  if (result.error) {
    throw new Error(`Failed to create notification: ${result.error.message}`);
  }

  return result.data.length;
}
