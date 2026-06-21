import { getOrderById, updateOrderRecord } from "@/lib/db/orders";
import { normalizeUpdateOrder } from "@/lib/orders/normalize";
import { updateOrderSchema } from "@/lib/orders/validation";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/orders/[id]">,
) {
  const { id } = await context.params;
  const existing = await getOrderById(id);

  if (!existing) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  const payload = await request.json();
  const parsed = updateOrderSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid order patch",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const order = await updateOrderRecord(id, normalizeUpdateOrder(existing, parsed.data));

  return Response.json({ order });
}
