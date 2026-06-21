import { z } from "zod";

const statusSchema = z.enum(["open", "partial", "closed"]);

export const createOrderSchema = z.object({
  placedAt: z.coerce.date().transform((value) => value.toISOString()),
  askPrice: z.coerce.number().nonnegative(),
  originalQuantity: z.coerce.number().positive(),
  estimatedFilledQuantity: z.coerce.number().nonnegative().default(0),
  predictedFilledQuantity: z.coerce.number().nonnegative().default(0),
  status: statusSchema.optional(),
  note: z.string().trim().max(280).nullable().optional(),
});

export const updateOrderSchema = z
  .object({
    placedAt: z.coerce.date().transform((value) => value.toISOString()).optional(),
    askPrice: z.coerce.number().nonnegative().optional(),
    originalQuantity: z.coerce.number().positive().optional(),
    estimatedFilledQuantity: z.coerce.number().nonnegative().optional(),
    predictedFilledQuantity: z.coerce.number().nonnegative().optional(),
    status: statusSchema.optional(),
    note: z.string().trim().max(280).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
