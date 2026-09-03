import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

/* =========================
   ENUMS
========================= */

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "SALES",
  "WAREHOUSE",
  "ACCOUNTS",
  "OPERATIONS",
]);

export const customerTypeEnum = pgEnum("customer_type", [
  "RETAIL",
  "WHOLESALE",
  "DISTRIBUTOR",
]);

export const customerStatusEnum = pgEnum("customer_status", [
  "LEAD",
  "ACTIVE",
  "INACTIVE",
]);

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "IN",
  "OUT",
]);

export const challanStatusEnum = pgEnum("challan_status", [
  "DRAFT",
  "CONFIRMED",
  "CANCELLED",
]);


/* =========================
   CASE STUDY 2 ENUMS
========================= */

export const inventoryTransactionTypeEnum = pgEnum(
  "inventory_transaction_type",
  ["IN", "OUT", "ADJUSTMENT"]
);

export const workOrderStatusEnum = pgEnum(
  "work_order_status",
  ["ASSIGNED", "IN_PROGRESS", "COMPLETED"]
);

export const transferStatusEnum = pgEnum(
  "transfer_status",
  ["REQUESTED", "DISPATCHED", "RECEIVED"]
);

export const customerOrderStatusEnum = pgEnum(
  "customer_order_status",
  ["RESERVED", "CANCELLED", "COMPLETED"]
);

/* =========================
   USERS
========================= */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  password: text("password").notNull(),

  role: userRoleEnum("role").notNull().default("SALES"),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

/* =========================
   CUSTOMERS
========================= */

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),

  customerName: varchar("customer_name", {
    length: 150,
  }).notNull(),

  mobile: varchar("mobile", {
    length: 20,
  }).notNull(),

  email: varchar("email", {
    length: 255,
  }),

  businessName: varchar("business_name", {
    length: 150,
  }).notNull(),

  gstNumber: varchar("gst_number", {
    length: 20,
  }),

  customerType: customerTypeEnum("customer_type")
    .notNull(),

  address: text("address").notNull(),

  status: customerStatusEnum("status")
    .notNull()
    .default("LEAD"),

  followUpDate: date("follow_up_date"),

  notes: text("notes"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});

/* =========================
   CUSTOMER FOLLOW-UPS
========================= */

export const customerFollowups = pgTable(
  "customer_followups",
  {
    id: serial("id").primaryKey(),

    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, {
        onDelete: "cascade",
      }),

    note: text("note").notNull(),

    followUpDate: date("follow_up_date"),

    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  }
);

/* =========================
   PRODUCTS
========================= */

export const products = pgTable("products", {
  id: serial("id").primaryKey(),

  name: varchar("name", {
    length: 150,
  }).notNull(),

  sku: varchar("sku", {
    length: 100,
  }).notNull().unique(),

  category: varchar("category", {
    length: 100,
  }).notNull(),

  unitPrice: decimal("unit_price", {
    precision: 12,
    scale: 2,
  }).notNull(),

  currentStock: integer("current_stock")
    .notNull()
    .default(0),

  minimumStock: integer("minimum_stock")
    .notNull()
    .default(0),

  warehouseLocation: varchar("warehouse_location", {
    length: 150,
  }).notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});


/* =========================
   LOCATIONS
========================= */

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),

  name: varchar("name", {
    length: 150,
  }).notNull().unique(),

  code: varchar("code", {
    length: 50,
  }).notNull().unique(),

  address: text("address"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});



/* =========================
   INVENTORY
========================= */

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),

  productId: integer("product_id")
    .notNull()
    .references(() => products.id),

  locationId: integer("location_id")
    .notNull()
    .references(() => locations.id),

  batchNumber: varchar("batch_number", {
    length: 100,
  }).notNull(),

  physicalQuantity: integer("physical_quantity")
    .notNull()
    .default(0),

  reservedQuantity: integer("reserved_quantity")
    .notNull()
    .default(0),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),
});



/* =========================
   INVENTORY TRANSACTIONS
========================= */

export const inventoryTransactions = pgTable(
  "inventory_transactions",
  {
    id: serial("id").primaryKey(),

    inventoryId: integer("inventory_id")
      .notNull()
      .references(() => inventory.id),

    transactionType: inventoryTransactionTypeEnum(
      "transaction_type"
    ).notNull(),

    quantity: integer("quantity")
      .notNull(),

    reason: varchar("reason", {
      length: 255,
    }).notNull(),

    reference: varchar("reference", {
      length: 100,
    }),

    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  }
);



/* =========================
   STOCK MOVEMENTS
========================= */

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: serial("id").primaryKey(),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id),

    quantity: integer("quantity").notNull(),

    movementType: stockMovementTypeEnum(
      "movement_type"
    ).notNull(),

    reason: varchar("reason", {
      length: 255,
    }).notNull(),

    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  }
);

/* =========================
   SALES CHALLANS
========================= */

export const salesChallans = pgTable(
  "sales_challans",
  {
    id: serial("id").primaryKey(),

    challanNumber: varchar("challan_number", {
      length: 50,
    }).notNull().unique(),

    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),

    totalQuantity: integer("total_quantity")
      .notNull()
      .default(0),

    status: challanStatusEnum("status")
      .notNull()
      .default("DRAFT"),

    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  }
);

/* =========================
   SALES CHALLAN ITEMS
========================= */

export const salesChallanItems = pgTable(
  "sales_challan_items",
  {
    id: serial("id").primaryKey(),

    challanId: integer("challan_id")
      .notNull()
      .references(() => salesChallans.id, {
        onDelete: "cascade",
      }),

    productId: integer("product_id")
      .notNull()
      .references(() => products.id),

    productName: varchar("product_name", {
      length: 150,
    }).notNull(),

    sku: varchar("sku", {
      length: 100,
    }).notNull(),

    unitPrice: decimal("unit_price", {
      precision: 12,
      scale: 2,
    }).notNull(),

    quantity: integer("quantity").notNull(),

    totalPrice: decimal("total_price", {
      precision: 12,
      scale: 2,
    }).notNull(),
  }
);