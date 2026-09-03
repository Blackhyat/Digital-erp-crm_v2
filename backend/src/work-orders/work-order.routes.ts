import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

import {
  getWorkOrders,
  createWorkOrder,
  updateWorkOrderStatus,
} from "./work-order.controller.js";

const router = Router();

/* =========================
   GET ALL WORK ORDERS
   All authenticated users
========================= */

router.get(
  "/",
  authenticate,
  getWorkOrders
);

/* =========================
   CREATE WORK ORDER
   Admin + Operations
========================= */

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "OPERATIONS"),
  createWorkOrder
);

/* =========================
   UPDATE STATUS
   Admin + Operations
========================= */

router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN", "OPERATIONS"),
  updateWorkOrderStatus
);

export default router;