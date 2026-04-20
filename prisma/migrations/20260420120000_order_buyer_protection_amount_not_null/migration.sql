-- Backfill and require buyer_protection_amount (always a decimal, 0 when no fee).
UPDATE "orders"
SET "buyer_protection_amount" = 0
WHERE "buyer_protection_amount" IS NULL;

ALTER TABLE "orders"
ALTER COLUMN "buyer_protection_amount" SET DEFAULT 0;

ALTER TABLE "orders"
ALTER COLUMN "buyer_protection_amount" SET NOT NULL;
