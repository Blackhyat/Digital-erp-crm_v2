import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";

import authRoutes from "./auth/auth.routes.js";
import customerRoutes from "./customers/customer.routes.js";
import productRoutes from "./products/product.routes.js";
import salesChallanRoutes from "./sales-challans/sales-challan.routes.js";
import inventoryRoutes from "./inventory/inventory.routes.js";


config();

const app = express();

/* =========================
   CORS
========================= */

app.use(
  cors({
    origin: "https://digital-erp-crm.vercel.app",
    credentials: true,
  })
);

/* =========================
   MIDDLEWARE
========================= */

app.use(express.json());
app.use(cookieParser());

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Mini ERP CRM API is running",
  });
});

/* =========================
   DATABASE TEST
========================= */

app.get("/db-test", async (_req, res) => {
  try {
    const { db } = await import("./db/db.js");

    await db.execute("SELECT 1");

    return res.json({
      success: true,
      message: "Database connected successfully",
    });
  } catch (error) {
    console.error("Database test error:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

/* =========================
   API ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales-challans", salesChallanRoutes);
app.use("/api/inventory", inventoryRoutes);

/* =========================
   404 HANDLER
========================= */

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =========================
   SERVER
========================= */

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});