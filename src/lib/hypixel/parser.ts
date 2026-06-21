import { z } from "zod";

import type { TablesInsert } from "@/lib/types/database";

const orderSummarySchema = z.object({
  amount: z.number().optional(),
  pricePerUnit: z.number().optional(),
  orders: z.number().optional(),
});

const productSchema = z.object({
  quick_status: z.object({
    productId: z.string().optional(),
    buyPrice: z.number(),
    sellPrice: z.number(),
    buyVolume: z.number().optional(),
    sellVolume: z.number().optional(),
    movingWeek: z.number().optional(),
    buyOrders: z.number().optional(),
    sellOrders: z.number().optional(),
  }),
  buy_summary: z.array(orderSummarySchema).optional(),
  sell_summary: z.array(orderSummarySchema).optional(),
});

const hypixelBazaarSchema = z.object({
  success: z.boolean(),
  lastUpdated: z.number().int().optional(),
  products: z.record(z.string(), productSchema),
});

export function parseBazaarSnapshot(
  payload: unknown,
  itemKey: string,
): TablesInsert<"market_snapshots"> {
  const parsed = hypixelBazaarSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(`Unexpected Hypixel Bazaar payload: ${parsed.error.message}`);
  }

  if (!parsed.data.success) {
    throw new Error("Hypixel Bazaar payload reported success=false");
  }

  const product = parsed.data.products[itemKey];

  if (!product) {
    const available = Object.keys(parsed.data.products).slice(0, 15).join(", ");
    throw new Error(
      `Bazaar product '${itemKey}' was not found in Hypixel data. Sample products: ${available}`,
    );
  }

  return {
    captured_at: parsed.data.lastUpdated
      ? new Date(parsed.data.lastUpdated).toISOString()
      : new Date().toISOString(),
    item_key: itemKey,
    product_id: product.quick_status.productId ?? itemKey,
    best_buy_price: product.quick_status.buyPrice,
    best_sell_price: product.quick_status.sellPrice,
    buy_volume: product.quick_status.buyVolume ?? null,
    sell_volume: product.quick_status.sellVolume ?? null,
    moving_week: product.quick_status.movingWeek ?? null,
    buy_orders: product.quick_status.buyOrders ?? null,
    sell_orders: product.quick_status.sellOrders ?? null,
    source_last_updated: parsed.data.lastUpdated ?? null,
    top_buy_summary: product.buy_summary?.slice(0, 20) ?? null,
    top_sell_summary: product.sell_summary?.slice(0, 20) ?? null,
    // ponytail: full bazaar payload is ~100-200KB with all products; 1GB Supabase fills fast
    raw_payload: { [itemKey]: parsed.data.products[itemKey] },
  };
}
