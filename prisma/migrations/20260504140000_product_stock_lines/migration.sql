-- CreateEnum
CREATE TYPE "StockLineStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'REFUNDED');

-- CreateTable
CREATE TABLE "product_stock_lines" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "status" "StockLineStatus" NOT NULL DEFAULT 'AVAILABLE',
    "order_item_id" TEXT,
    "reserved_at" TIMESTAMP(3),
    "reserved_until" TIMESTAMP(3),
    "sold_at" TIMESTAMP(3),
    "retired_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_stock_lines_pkey" PRIMARY KEY ("id")
);

-- ForeignKeys
ALTER TABLE "product_stock_lines" ADD CONSTRAINT "product_stock_lines_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_stock_lines" ADD CONSTRAINT "product_stock_lines_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Unique
CREATE UNIQUE INDEX "product_stock_lines_variant_id_content_hash_key" ON "product_stock_lines"("variant_id", "content_hash");

-- Indexes
CREATE INDEX "product_stock_lines_variant_id_status_idx" ON "product_stock_lines"("variant_id", "status");

CREATE INDEX "product_stock_lines_order_item_id_idx" ON "product_stock_lines"("order_item_id");

CREATE INDEX "product_stock_lines_status_reserved_until_idx" ON "product_stock_lines"("status", "reserved_until");

-- One-shot stock reset for variant-backed products
UPDATE "product_variants" SET "stock_quantity" = 0;

UPDATE "products"
SET "stock_quantity" = 0
WHERE "id" IN (SELECT DISTINCT "product_id" FROM "product_variants");
