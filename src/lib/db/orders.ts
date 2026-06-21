import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert, TablesUpdate } from "@/lib/types/database";

export async function listOrders() {
  const supabase = createSupabaseAdminClient();

  const result = await supabase
    .from("orders")
    .select("*")
    .order("placed_at", { ascending: false });

  if (result.error) {
    throw new Error(`Failed to list orders: ${result.error.message}`);
  }

  return result.data;
}

export async function listActiveOrders() {
  const supabase = createSupabaseAdminClient();

  const result = await supabase
    .from("orders")
    .select("*")
    .in("status", ["open", "partial"])
    .order("placed_at", { ascending: false });

  if (result.error) {
    throw new Error(`Failed to list active orders: ${result.error.message}`);
  }

  return result.data;
}

export async function getOrderById(orderId: string) {
  const supabase = createSupabaseAdminClient();

  const result = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Failed to fetch order: ${result.error.message}`);
  }

  return result.data;
}

export async function insertOrder(order: TablesInsert<"orders">) {
  const supabase = createSupabaseAdminClient();

  const result = await supabase.from("orders").insert(order).select("*").single();

  if (result.error) {
    throw new Error(`Failed to create order: ${result.error.message}`);
  }

  return result.data;
}

export async function updateOrderRecord(
  orderId: string,
  patch: TablesUpdate<"orders">,
) {
  const supabase = createSupabaseAdminClient();

  const result = await supabase
    .from("orders")
    .update(patch)
    .eq("id", orderId)
    .select("*")
    .single();

  if (result.error) {
    throw new Error(`Failed to update order: ${result.error.message}`);
  }

  return result.data;
}

export async function deleteOrderRecord(orderId: string) {
  const supabase = createSupabaseAdminClient();

  const result = await supabase.from("orders").delete().eq("id", orderId).select("id").single();

  if (result.error) {
    throw new Error(`Failed to delete order: ${result.error.message}`);
  }

  return result.data;
}
