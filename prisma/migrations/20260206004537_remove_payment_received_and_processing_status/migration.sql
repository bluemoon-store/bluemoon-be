-- Update existing orders with PAYMENT_RECEIVED or PROCESSING status to COMPLETED
UPDATE "orders" SET "status" = 'COMPLETED' WHERE "status" IN ('PAYMENT_RECEIVED', 'PROCESSING');

-- Remove PAYMENT_RECEIVED and PROCESSING from OrderStatus enum
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus" USING "status"::text::"OrderStatus";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "OrderStatus_old";
