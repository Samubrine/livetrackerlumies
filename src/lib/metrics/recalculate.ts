import { getSnapshotById } from "@/lib/db/market-snapshots";
import { createNotificationIfAbsent } from "@/lib/db/notifications";
import { insertOrderFillEvent } from "@/lib/db/order-fill-events";
import { listActiveOrders, updateOrderRecord } from "@/lib/db/orders";
export async function recalculateFromLatestSnapshot(snapshotId: string) {
  const [snapshot, activeOrders] = await Promise.all([
    getSnapshotById(snapshotId),
    listActiveOrders(),
  ]);

  if (!snapshot) {
    throw new Error(`Snapshot ${snapshotId} was not found for recalculation`);
  }

  let updatesApplied = 0;
  let notificationsCreated = 0;

  for (const order of activeOrders) {
    let estimatedFilledQuantity = order.estimated_filled_quantity;
    let predictedFilledQuantity = order.predicted_filled_quantity;
    let remainingQuantity = order.remaining_quantity;
    let status = order.status;
    let changed = false;

    if (snapshot.best_sell_price > order.ask_price && remainingQuantity > 0) {
      estimatedFilledQuantity = order.original_quantity;
      predictedFilledQuantity = 0;
      remainingQuantity = 0;
      status = "closed";
      changed = true;

      await insertOrderFillEvent({
        order_id: order.id,
        snapshot_id: snapshot.id,
        event_type: "confirmed_fill_increment",
        quantity_delta: order.original_quantity - order.estimated_filled_quantity,
        reason: `Best sell moved above ask (${snapshot.best_sell_price} > ${order.ask_price}).`,
      });
    } else if (snapshot.best_sell_price === order.ask_price && remainingQuantity > 0) {
      const queueDepth = Array.isArray(snapshot.top_sell_summary)
        ? snapshot.top_sell_summary.find(
            (entry) =>
              typeof entry === "object" &&
              entry !== null &&
              "pricePerUnit" in entry &&
              Number(entry.pricePerUnit) === order.ask_price,
          )
        : null;

      if (queueDepth && typeof queueDepth === "object" && "amount" in queueDepth) {
        const visibleAmount = Number(queueDepth.amount ?? 0);
        const targetPredicted = Math.max(
          0,
          Math.min(order.original_quantity, order.original_quantity - visibleAmount),
        );

        if (targetPredicted !== predictedFilledQuantity) {
          predictedFilledQuantity = targetPredicted;
          changed = true;
        }
      }
    } else if (snapshot.best_sell_price < order.ask_price && predictedFilledQuantity !== 0) {
      predictedFilledQuantity = 0;
      changed = true;
    }

    if (snapshot.best_sell_price < order.ask_price) {
      notificationsCreated += await createNotificationIfAbsent({
        order_id: order.id,
        notification_type: "outbid",
        message: `Order at ${order.ask_price} is now above the live best sell ${snapshot.best_sell_price}. Best buy is ${snapshot.best_buy_price}.`,
      });
    }

    if (changed) {
      await updateOrderRecord(order.id, {
        estimated_filled_quantity: estimatedFilledQuantity,
        predicted_filled_quantity: predictedFilledQuantity,
        remaining_quantity: remainingQuantity,
        status,
        updated_at: new Date().toISOString(),
      });
      updatesApplied += 1;
    }
  }

  return {
    snapshotId,
    activeOrdersChecked: activeOrders.length,
    updatesApplied,
    notificationsCreated,
    mode: "best-sell-pass",
  };
}
