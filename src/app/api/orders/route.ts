import { createOrderSchema } from "@/lib/orders/validation";
import { listOrders, insertOrder } from "@/lib/db/orders";
import { normalizeCreateOrder } from "@/lib/orders/normalize";

export async function GET() {
  const orders = await listOrders();
  return Response.json({ orders });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createOrderSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid order payload",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const order = await insertOrder(normalizeCreateOrder(parsed.data));

  return Response.json({ order }, { status: 201 });
}
