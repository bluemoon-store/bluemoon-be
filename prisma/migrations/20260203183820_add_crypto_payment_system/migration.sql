-- AlterEnum: Update CryptoCurrency enum - add new currencies
ALTER TYPE "CryptoCurrency" ADD VALUE 'USDT_TRC20';
ALTER TYPE "CryptoCurrency" ADD VALUE 'USDC_ERC20';

-- AlterEnum: Update PaymentStatus enum
-- Create new enum type
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PAID', 'CONFIRMING', 'CONFIRMED', 'FORWARDING', 'FORWARDED', 'EXPIRED', 'FAILED');

-- Migrate existing data
ALTER TABLE "crypto_payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "crypto_payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING (
  CASE 
    WHEN "status"::text = 'PARTIAL' THEN 'PAID'::text
    ELSE "status"::text
  END
)::"PaymentStatus_new";
ALTER TABLE "crypto_payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Drop old enum and rename new one
DROP TYPE "PaymentStatus";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";

-- AlterTable: Add new columns to crypto_payments
ALTER TABLE "crypto_payments" 
  ADD COLUMN "network" TEXT,
  ADD COLUMN "derivation_index" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "derivation_path" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "encrypted_private_key" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "platform_wallet_address" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "forward_tx_hash" TEXT,
  ADD COLUMN "forwarded_at" TIMESTAMP(3),
  ADD COLUMN "metadata" JSONB,
  ALTER COLUMN "amount" TYPE DECIMAL(30,18),
  ALTER COLUMN "exchange_rate" DROP NOT NULL;

-- CreateIndex: Add new indexes on crypto_payments
CREATE INDEX "crypto_payments_cryptocurrency_idx" ON "crypto_payments"("cryptocurrency");
CREATE INDEX "crypto_payments_expires_at_idx" ON "crypto_payments"("expires_at");

-- CreateTable: system_wallet_indexes
CREATE TABLE "system_wallet_indexes" (
    "id" TEXT NOT NULL,
    "cryptocurrency" "CryptoCurrency" NOT NULL,
    "next_index" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_wallet_indexes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_wallet_indexes_cryptocurrency_key" ON "system_wallet_indexes"("cryptocurrency");

-- CreateTable: crypto_exchange_rates
CREATE TABLE "crypto_exchange_rates" (
    "id" TEXT NOT NULL,
    "cryptocurrency" "CryptoCurrency" NOT NULL,
    "fiat_currency" TEXT NOT NULL DEFAULT 'USD',
    "rate" DECIMAL(20,8) NOT NULL,
    "provider" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crypto_exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crypto_exchange_rates_cryptocurrency_idx" ON "crypto_exchange_rates"("cryptocurrency");
CREATE INDEX "crypto_exchange_rates_expires_at_idx" ON "crypto_exchange_rates"("expires_at");
CREATE UNIQUE INDEX "crypto_exchange_rates_cryptocurrency_fiat_currency_key" ON "crypto_exchange_rates"("cryptocurrency", "fiat_currency");
