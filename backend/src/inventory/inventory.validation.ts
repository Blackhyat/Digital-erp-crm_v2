import { z } from "zod";

export const createInventorySchema = z.object({
  productId: z.number().int().positive(),

  locationId: z.number().int().positive(),

  batchNumber: z
    .string()
    .min(1, "Batch number is required")
    .max(100),

  physicalQuantity: z
    .number()
    .int()
    .min(0, "Physical quantity cannot be negative"),

  reservedQuantity: z
    .number()
    .int()
    .min(0, "Reserved quantity cannot be negative"),
});

export const updateInventorySchema = z.object({
  physicalQuantity: z
    .number()
    .int()
    .min(0)
    .optional(),

  reservedQuantity: z
    .number()
    .int()
    .min(0)
    .optional(),

  batchNumber: z
    .string()
    .min(1)
    .max(100)
    .optional(),

  locationId: z
    .number()
    .int()
    .positive()
    .optional(),

  productId: z
    .number()
    .int()
    .positive()
    .optional(),
});