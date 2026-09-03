import { Router } from "express";

import {
  getInventory,
  createInventory,
  updateInventory,
} from "./inventory.controller.js";

import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

const router = Router();

/* =========================
   GET INVENTORY
   All authenticated users
========================= */

router.get(
  "/",
  authenticate,
  getInventory
);

/* =========================
   CREATE INVENTORY
   Admin + Operations
========================= */

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "OPERATIONS"),
  createInventory
);

/* =========================
   UPDATE INVENTORY
   Admin + Operations
========================= */

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "OPERATIONS"),
  updateInventory
);

export default router;