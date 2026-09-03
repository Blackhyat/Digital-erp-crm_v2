import type { Response } from "express";
import { and, eq } from "drizzle-orm";

import { db } from "../db/db.js";
import {
  inventory,
  locations,
  products,
} from "../db/schema.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

import {
  createInventorySchema,
  updateInventorySchema,
} from "./inventory.validation.js";

/* =========================
   GET ALL INVENTORY
========================= */

export const getInventory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const rows = await db
      .select({
        id: inventory.id,
        productId: inventory.productId,
        productName: products.name,
        locationId: inventory.locationId,
        locationName: locations.name,
        batchNumber: inventory.batchNumber,
        physicalQuantity: inventory.physicalQuantity,
        reservedQuantity: inventory.reservedQuantity,
        createdAt: inventory.createdAt,
        updatedAt: inventory.updatedAt,
      })
      .from(inventory)
      .leftJoin(
        products,
        eq(inventory.productId, products.id)
      )
      .leftJoin(
        locations,
        eq(inventory.locationId, locations.id)
      );

    const data = rows.map((item) => ({
      ...item,
      availableQuantity:
        item.physicalQuantity - item.reservedQuantity,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
    });
  }
};

/* =========================
   CREATE INVENTORY
========================= */

export const createInventory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const validation =
      createInventorySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory data",
        errors: validation.error.flatten(),
      });
    }

    const {
      productId,
      locationId,
      batchNumber,
      physicalQuantity,
      reservedQuantity,
    } = validation.data;

    if (reservedQuantity > physicalQuantity) {
      return res.status(400).json({
        success: false,
        message:
          "Reserved quantity cannot be greater than physical quantity",
      });
    }

    const existing = await db
      .select({
        id: inventory.id,
      })
      .from(inventory)
      .where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.locationId, locationId),
          eq(inventory.batchNumber, batchNumber)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Inventory already exists for this product, location and batch",
      });
    }

    const [created] = await db
      .insert(inventory)
      .values({
        productId,
        locationId,
        batchNumber,
        physicalQuantity,
        reservedQuantity,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      data: {
        ...created,
        availableQuantity:
          created.physicalQuantity -
          created.reservedQuantity,
      },
    });
  } catch (error) {
    console.error("Create inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create inventory",
    });
  }
};

/* =========================
   UPDATE INVENTORY
========================= */

export const updateInventory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const inventoryId = Number(req.params.id);

    if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory ID",
      });
    }

    const validation =
      updateInventorySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory data",
        errors: validation.error.flatten(),
      });
    }

    const existing = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, inventoryId))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    const current = existing[0];

    const physicalQuantity =
      validation.data.physicalQuantity ??
      current.physicalQuantity;

    const reservedQuantity =
      validation.data.reservedQuantity ??
      current.reservedQuantity;

    if (reservedQuantity > physicalQuantity) {
      return res.status(400).json({
        success: false,
        message:
          "Reserved quantity cannot be greater than physical quantity",
      });
    }

    const [updated] = await db
      .update(inventory)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(inventory.id, inventoryId))
      .returning();

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: {
        ...updated,
        availableQuantity:
          updated.physicalQuantity -
          updated.reservedQuantity,
      },
    });
  } catch (error) {
    console.error("Update inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update inventory",
    });
  }
};