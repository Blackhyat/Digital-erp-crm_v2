import type { Response } from "express";
import { eq, and } from "drizzle-orm";

import { db } from "../db/db.js";
import {
  workOrders,
  workOrderMaterials,
  inventory,
  locations,
  products,
  users,
} from "../db/schema.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

import {
  createWorkOrderSchema,
  updateWorkOrderStatusSchema,
} from "./work-order.validation.js";

/* =========================
   GET ALL WORK ORDERS
========================= */

export const getWorkOrders = async (
  _req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const rows = await db
      .select({
        id: workOrders.id,
        workOrderNumber: workOrders.workOrderNumber,
        locationId: workOrders.locationId,
        locationName: locations.name,
        productId: workOrders.productId,
        productName: products.name,
        requiredQuantity: workOrders.requiredQuantity,
        assignedUserId: workOrders.assignedUserId,
        assignedUserName: users.name,
        status: workOrders.status,
        createdAt: workOrders.createdAt,
        updatedAt: workOrders.updatedAt,
      })
      .from(workOrders)
      .leftJoin(
        locations,
        eq(workOrders.locationId, locations.id)
      )
      .leftJoin(
        products,
        eq(workOrders.productId, products.id)
      )
      .leftJoin(
        users,
        eq(workOrders.assignedUserId, users.id)
      )
      .orderBy(workOrders.id);

    const data = [];

    for (const row of rows) {
      const materialRows = await db
        .select({
          requiredQuantity:
            workOrderMaterials.requiredQuantity,
          availableQuantity:
            workOrderMaterials.availableQuantity,
          shortageQuantity:
            workOrderMaterials.shortageQuantity,
        })
        .from(workOrderMaterials)
        .where(
          eq(
            workOrderMaterials.workOrderId,
            row.id
          )
        );

      data.push({
        ...row,
        materials: materialRows,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(
      "Get work orders error:",
      error?.message || error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch work orders",
    });
  }
};

/* =========================
   CREATE WORK ORDER
========================= */

export const createWorkOrder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  let createdWorkOrderId: number | null = null;

  try {
    /* =========================
       AUTHENTICATION
    ========================= */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /* =========================
       VALIDATE REQUEST
    ========================= */

    const result = createWorkOrderSchema.safeParse(
      req.body
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid work order data",
        errors: result.error.flatten(),
      });
    }

    const {
      workOrderNumber,
      locationId,
      productId,
      requiredQuantity,
      assignedUserId,
    } = result.data;

    /* =========================
       CHECK WORK ORDER NUMBER
    ========================= */

    const existingWorkOrder = await db
      .select({
        id: workOrders.id,
      })
      .from(workOrders)
      .where(
        eq(
          workOrders.workOrderNumber,
          workOrderNumber
        )
      )
      .limit(1);

    if (existingWorkOrder.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Work order number already exists",
      });
    }

    /* =========================
       CHECK LOCATION
    ========================= */

    const locationRows = await db
      .select({
        id: locations.id,
        name: locations.name,
      })
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);

    if (locationRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    /* =========================
       CHECK PRODUCT
    ========================= */

    const productRows = await db
      .select({
        id: products.id,
        name: products.name,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (productRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /* =========================
       CHECK ASSIGNED USER
    ========================= */

    const assignedUserRows = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, assignedUserId))
      .limit(1);

    if (assignedUserRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assigned user not found",
      });
    }

    /* =========================
       CALCULATE AVAILABLE STOCK
       
       Available =
       Physical Quantity - Reserved Quantity
    ========================= */

    const inventoryRows = await db
      .select({
        id: inventory.id,
        physicalQuantity:
          inventory.physicalQuantity,
        reservedQuantity:
          inventory.reservedQuantity,
        batchNumber: inventory.batchNumber,
      })
      .from(inventory)
      .where(
        and(
          eq(inventory.locationId, locationId),
          eq(inventory.productId, productId)
        )
      );

    const availableQuantity = inventoryRows.reduce(
      (total, item) => {
        const physical =
          item.physicalQuantity ?? 0;

        const reserved =
          item.reservedQuantity ?? 0;

        const available = Math.max(
          physical - reserved,
          0
        );

        return total + available;
      },
      0
    );

    /* =========================
       CALCULATE SHORTAGE
    ========================= */

    const shortageQuantity = Math.max(
      requiredQuantity - availableQuantity,
      0
    );

    /* =========================
       CREATE WORK ORDER
    ========================= */

    const inserted = await db
      .insert(workOrders)
      .values({
        workOrderNumber,
        locationId,
        productId,
        requiredQuantity,
        assignedUserId,
        status: "ASSIGNED",
        createdBy: req.user.userId,
      })
      .returning();

    if (!inserted[0]) {
      throw new Error(
        "Work order could not be created"
      );
    }

    const workOrder = inserted[0];

    createdWorkOrderId = workOrder.id;

    /* =========================
       CREATE WORK ORDER MATERIAL
    ========================= */

    const materialInserted = await db
      .insert(workOrderMaterials)
      .values({
        workOrderId: workOrder.id,
        productId,
        requiredQuantity,
        availableQuantity,
        shortageQuantity,
      })
      .returning();

    if (!materialInserted[0]) {
      throw new Error(
        "Work order material could not be created"
      );
    }

    /* =========================
       SUCCESS RESPONSE
    ========================= */

    return res.status(201).json({
      success: true,
      message: "Work order created successfully",
      data: {
        id: workOrder.id,
        workOrderNumber:
          workOrder.workOrderNumber,
        locationId: workOrder.locationId,
        productId: workOrder.productId,
        requiredQuantity:
          workOrder.requiredQuantity,
        assignedUserId:
          workOrder.assignedUserId,
        status: workOrder.status,
        availableQuantity,
        shortageQuantity,
      },
    });
  } catch (error: any) {
    console.error(
      "================================="
    );
    console.error(
      "CREATE WORK ORDER ERROR"
    );
    console.error(
      "Message:",
      error?.message
    );
    console.error(
      "Code:",
      error?.code
    );
    console.error(
      "Detail:",
      error?.detail
    );
    console.error(
      "Constraint:",
      error?.constraint
    );
    console.error(
      "================================="
    );

    /* =========================
       CLEANUP PARTIAL WORK ORDER
    ========================= */

    if (createdWorkOrderId !== null) {
      try {
        await db
          .delete(workOrderMaterials)
          .where(
            eq(
              workOrderMaterials.workOrderId,
              createdWorkOrderId
            )
          );

        await db
          .delete(workOrders)
          .where(
            eq(
              workOrders.id,
              createdWorkOrderId
            )
          );

        console.log(
          "Partial work order cleaned up:",
          createdWorkOrderId
        );
      } catch (cleanupError: any) {
        console.error(
          "Cleanup error:",
          cleanupError?.message ||
            cleanupError
        );
      }
    }

    /* =========================
       DUPLICATE WORK ORDER
    ========================= */

    if (error?.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "Work order number already exists",
      });
    }

    /* =========================
       DEVELOPMENT ERROR
    ========================= */

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to create work order",
    });
  }
};

/* =========================
   UPDATE WORK ORDER STATUS
========================= */

export const updateWorkOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    /* =========================
       VALIDATE ID
    ========================= */

    const workOrderId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(workOrderId) ||
      workOrderId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid work order ID",
      });
    }

    /* =========================
       VALIDATE STATUS
    ========================= */

    const result =
      updateWorkOrderStatusSchema.safeParse(
        req.body
      );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        errors: result.error.flatten(),
      });
    }

    /* =========================
       FIND WORK ORDER
    ========================= */

    const existing = await db
      .select()
      .from(workOrders)
      .where(
        eq(
          workOrders.id,
          workOrderId
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Work order not found",
      });
    }

    const currentStatus =
      existing[0].status;

    const newStatus =
      result.data.status;

    /* =========================
       STATUS FLOW
       
       ASSIGNED
          ↓
       IN_PROGRESS
          ↓
       COMPLETED
    ========================= */

    const validTransition =
      (currentStatus === "ASSIGNED" &&
        newStatus === "IN_PROGRESS") ||
      (currentStatus === "IN_PROGRESS" &&
        newStatus === "COMPLETED") ||
      currentStatus === newStatus;

    if (!validTransition) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status transition. Allowed flow: ASSIGNED → IN_PROGRESS → COMPLETED",
      });
    }

    /* =========================
       UPDATE STATUS
    ========================= */

    const updated = await db
      .update(workOrders)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(
        eq(
          workOrders.id,
          workOrderId
        )
      )
      .returning();

    return res.status(200).json({
      success: true,
      message:
        "Work order status updated successfully",
      data: updated[0],
    });
  } catch (error: any) {
    console.error(
      "Update work order status error:",
      error?.message || error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to update work order status",
    });
  }
};