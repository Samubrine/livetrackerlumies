import { getSnapshotById } from "@/lib/db/market-snapshots";
import { createNotificationIfAbsent } from "@/lib/db/notifications";
import { insertOrderFillEvent } from "@/lib/db/order-fill-events";
import { listActiveOrders, updateOrderRecord } from "@/lib/db/orders";

/**
 * Parses the top_buy_summary JSON column into a typed array.
 * Hypixel buy_summary is sorted highest-price first (best buyers at top).
 */
function parseBuySummary(raw: unknown): Array<{ pricePerUnit: number; amount: number }> {
  if (!Array.isArray(raw)) return [];

  const result: Array<{ pricePerUnit: number; amount: number }> = [];

  for (const entry of raw) {
    if (
      entry !== null &&
      typeof entry === "object" &&
      "pricePerUnit" in entry &&
      "amount" in entry
    ) {
      const price = Number(entry.pricePerUnit);
      const amount = Number(entry.amount);

      if (!isNaN(price) && !isNaN(amount)) {
        result.push({ pricePerUnit: price, amount });
      }
    }
  }

  return result;
}

/**
 * Queue-position heuristic for predicted fill quantity.
 *
 * The Hypixel buy_summary lists up to 20 price tiers, sorted highest-price
 * first. Higher-priced orders fill before lower-priced ones.
 *
 * Model:
 *   - volumeAbove  = total volume at prices strictly above the order's ask_price
 *                    (these fill before the tracked order)
 *   - tierVolume   = total volume remaining at exactly the order's ask_price
 *                    (shared by all orders at that tier, including the tracked order)
 *   - If tierVolume is absent (price not in top 20): order may already be filled
 *     or is below the visible depth — we cannot predict from this snapshot alone.
 *   - predictedFilled = max(0, original_quantity - tierVolume)
 *     Rationale: if tierVolume has shrunk below original_quantity, at least that
 *     difference has been consumed from the tier. Pessimistic assumption: the
 *     tracked order absorbs none of the ahead-volume shrinkage until its own
 *     tier is reached, but if the tier itself is smaller than the order size
 *     something in this tier (including potentially the tracked order) has filled.
 *
 * Returns { predictedFilled, inQueue } where inQueue=false means price not found
 * in the top-20 buy summary (ambiguous state).
 */
function estimatePredictedFill(
  buySummary: Array<{ pricePerUnit: number; amount: number }>,
  askPrice: number,
  originalQuantity: number,
): { predictedFilled: number; inQueue: boolean } {
  // Find the tier at exactly the order's ask price
  const tierIndex = buySummary.findIndex(
    (entry) => Math.abs(entry.pricePerUnit - askPrice) < 0.001,
  );

  if (tierIndex === -1) {
    // Price not visible in top 20 — cannot infer fill from this snapshot
    return { predictedFilled: 0, inQueue: false };
  }

  const tierVolume = buySummary[tierIndex]!.amount;

  // Volume at prices strictly above the order (fills before the tracked order)
  // These are entries with index < tierIndex since the list is sorted desc
  const volumeAbove = buySummary
    .slice(0, tierIndex)
    .reduce((acc, entry) => acc + entry.amount, 0);

  // If any significant volume is still ahead, our tier hasn't been touched yet
  // predictedFilled from tier shrinkage: if tierVolume < originalQuantity,
  // at least (originalQuantity - tierVolume) units have been consumed from
  // this tier (could include the tracked order)
  const predictedFilled = volumeAbove > 0
    ? 0 // Still queue ahead — tier not yet reached
    : Math.max(0, originalQuantity - tierVolume);

  return { predictedFilled, inQueue: true };
}

export async function recalculateFromLatestSnapshot(snapshotId: string) {
  const [snapshot, activeOrders] = await Promise.all([
    getSnapshotById(snapshotId),
    listActiveOrders(),
  ]);

  if (!snapshot) {
    throw new Error(`Snapshot ${snapshotId} was not found for recalculation`);
  }

  const buySummary = parseBuySummary(snapshot.top_buy_summary);

  let updatesApplied = 0;
  let notificationsCreated = 0;

  for (const order of activeOrders) {
    let estimatedFilledQuantity = order.estimated_filled_quantity;
    let predictedFilledQuantity = order.predicted_filled_quantity;
    let remainingQuantity = order.remaining_quantity;
    let status = order.status;
    let changed = false;

    // ── Confirmed full fill ──────────────────────────────────────────────────
    // If the best buy price meets or exceeds the order's ask price the order
    // has been fully matched by an incoming buy order.
    if (snapshot.best_buy_price >= order.ask_price && remainingQuantity > 0) {
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
        reason: `Best buy met ask (${snapshot.best_buy_price} >= ${order.ask_price}).`,
      });
    } else if (remainingQuantity > 0) {
      // ── Queue-position predicted fill ──────────────────────────────────────
      // Use the top-20 buy order book to estimate how much of the order has
      // likely been filled based on queue depth above the order's price tier.
      const { predictedFilled, inQueue } = estimatePredictedFill(
        buySummary,
        order.ask_price,
        order.original_quantity,
      );

      if (inQueue) {
        if (predictedFilled !== predictedFilledQuantity) {
          predictedFilledQuantity = predictedFilled;
          changed = true;

          if (predictedFilled > 0) {
            await insertOrderFillEvent({
              order_id: order.id,
              snapshot_id: snapshot.id,
              event_type: "predicted_fill_increment",
              quantity_delta: predictedFilled - order.predicted_filled_quantity,
              reason: `Queue-position heuristic: tier volume shrank below order size (predicted ${predictedFilled} filled).`,
            });
          }
        }

        // Promote to partial if we have a non-zero predicted fill
        if (predictedFilled > 0 && status === "open") {
          status = "partial";
          changed = true;
        }
      } else {
        // Price not in top-20 buy summary: reset predicted fill to 0
        // (could mean order is below visible depth — not enough data)
        if (predictedFilledQuantity !== 0) {
          predictedFilledQuantity = 0;
          changed = true;
        }
      }
    }

    // ── Outbid notification ──────────────────────────────────────────────────
    // best_buy_price is the top of the buy book. If it has moved above the
    // tracked order's ask, the order has been undercut by a higher buyer.
    if (snapshot.best_buy_price !== null && snapshot.best_buy_price > order.ask_price) {
      notificationsCreated += await createNotificationIfAbsent({
        order_id: order.id,
        notification_type: "outbid",
        message: `Your buy order at ${order.ask_price} coins is now outbid. Best buy is ${snapshot.best_buy_price} — raise your price to fill faster.`,
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
    mode: "queue-position-heuristic",
  };
}
