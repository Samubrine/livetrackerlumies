import type { CreateOrderInput, UpdateOrderInput } from "@/lib/orders/validation";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/types/database";

type OrderRow = Tables<"orders">;

function deriveStatus(estimatedFilledQuantity: number, remainingQuantity: number) {
  if (remainingQuantity <= 0) {
    return "closed" as const;
  }

  if (estimatedFilledQuantity > 0) {
    return "partial" as const;
  }

  return "open" as const;
}

export function normalizeCreateOrder(input: CreateOrderInput): TablesInsert<"orders"> {
  const estimatedFilledQuantity = Math.min(
    input.estimatedFilledQuantity,
    input.originalQuantity,
  );
  const remainingQuantity = Math.max(0, input.originalQuantity - estimatedFilledQuantity);
  const status = input.status ?? deriveStatus(estimatedFilledQuantity, remainingQuantity);

  return {
    placed_at: input.placedAt,
    ask_price: input.askPrice,
    original_quantity: input.originalQuantity,
    estimated_filled_quantity: estimatedFilledQuantity,
    predicted_filled_quantity: input.predictedFilledQuantity,
    remaining_quantity: status === "closed" ? 0 : remainingQuantity,
    status:
      status === "closed"
        ? "closed"
        : deriveStatus(estimatedFilledQuantity, remainingQuantity),
    note: input.note ?? null,
  };
}

export function normalizeUpdateOrder(
  existing: OrderRow,
  patch: UpdateOrderInput,
): TablesUpdate<"orders"> {
  const originalQuantity = patch.originalQuantity ?? existing.original_quantity;
  const estimatedFilledQuantity = Math.min(
    patch.estimatedFilledQuantity ?? existing.estimated_filled_quantity,
    originalQuantity,
  );
  const remainingQuantity = Math.max(0, originalQuantity - estimatedFilledQuantity);
  const derivedStatus = deriveStatus(estimatedFilledQuantity, remainingQuantity);
  const requestedStatus = patch.status ?? derivedStatus;

  return {
    placed_at: patch.placedAt ?? existing.placed_at,
    ask_price: patch.askPrice ?? existing.ask_price,
    original_quantity: originalQuantity,
    estimated_filled_quantity: estimatedFilledQuantity,
    predicted_filled_quantity:
      patch.predictedFilledQuantity ?? existing.predicted_filled_quantity,
    remaining_quantity: requestedStatus === "closed" ? 0 : remainingQuantity,
    status: requestedStatus === "closed" ? "closed" : derivedStatus,
    note: patch.note === undefined ? existing.note : patch.note,
    updated_at: new Date().toISOString(),
  };
}
