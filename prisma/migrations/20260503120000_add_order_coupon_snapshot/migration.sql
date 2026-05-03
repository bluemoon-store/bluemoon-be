-- AlterTable
ALTER TABLE "coupons" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "subtotal_amount" DECIMAL(20,8) NOT NULL DEFAULT 0,
ADD COLUMN "discount_amount" DECIMAL(20,8) NOT NULL DEFAULT 0,
ADD COLUMN "coupon_id" TEXT,
ADD COLUMN "coupon_code" TEXT;

-- Backfill pre-coupon orders: historical total was subtotal + buyer protection (no discount).
UPDATE "orders"
SET
    "subtotal_amount" = "total_amount" - "buyer_protection_amount",
    "discount_amount" = 0
WHERE "coupon_id" IS NULL;

-- CreateIndex
CREATE INDEX "orders_coupon_id_idx" ON "orders"("coupon_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
