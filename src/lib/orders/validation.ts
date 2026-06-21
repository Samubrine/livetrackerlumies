import { z } from "zod";

const statusSchema = z.enum(["open", "partial", "closed"]);

export const createOrderSchema = z.object({
  placedAt: z.coerce.date().transform((value) => value.toISOString()),
  askPrice: z.number().nonnegative(),
  originalQuantity: z.number().positive(),
  estimatedFilledQuantity: z.number().nonnegative().default(0),
  predictedFilledQuantity: z.number().nonnegative().default(0),
  status: statusSchema.optional(),
  note: z.string().trim().max(280).nullable().optional(),
});

export const updateOrderSchema = z
  .object({
    placedAt: z.coerce.date().transform((value) => value.toISOString()).optional(),
    askPrice: z.number().nonnegative().optional(),
    originalQuantity: z.number().positive().optional(),
    estimatedFilledQuantity: z.number().nonnegative().optional(),
    predictedFilledQuantity: z.number().nonnegative().optional(),
    status: statusSchema.optional(),
    note: z.string().trim().max(280).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
