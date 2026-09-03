import { z } from "zod";

export const createWorkOrderSchema = z.object({
  workOrderNumber: z
    .string()
    .min(1, "Work order number is required")
    .max(50),

  locationId: z
    .number()
    .int()
    .positive(),

  productId: z
    .number()
    .int()
    .positive(),

  requiredQuantity: z
    .number()
    .int()
    .positive(),

  assignedUserId: z
    .number()
    .int()
    .positive(),
});

export const updateWorkOrderStatusSchema = z.object({
  status: z.enum([
    "ASSIGNED",
    "IN_PROGRESS",
    "COMPLETED",
  ]),
});