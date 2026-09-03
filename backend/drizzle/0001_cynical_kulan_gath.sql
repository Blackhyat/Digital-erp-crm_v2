CREATE TYPE "public"."customer_order_status" AS ENUM('RESERVED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."inventory_transaction_type" AS ENUM('IN', 'OUT', 'ADJUSTMENT');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('REQUESTED', 'DISPATCHED', 'RECEIVED');--> statement-breakpoint
CREATE TYPE "public"."work_order_status" AS ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'OPERATIONS';--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"batch_number" varchar(100) NOT NULL,
	"physical_quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "locations_name_unique" UNIQUE("name"),
	CONSTRAINT "locations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;