-- CreateTable
CREATE TABLE "wallet_topups" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "cryptocurrency" "CryptoCurrency" NOT NULL,
    "network" TEXT,
    "payment_address" TEXT NOT NULL,
    "derivation_index" INTEGER NOT NULL,
    "derivation_path" TEXT NOT NULL,
    "encrypted_private_key" TEXT NOT NULL,
    "amount" DECIMAL(30,18) NOT NULL,
    "amount_usd" DECIMAL(20,2) NOT NULL,
    "exchange_rate" DECIMAL(20,8),
    "platform_wallet_address" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "tx_hash" TEXT,
    "forward_tx_hash" TEXT,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "required_confirmations" INTEGER NOT NULL DEFAULT 3,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "forwarded_at" TIMESTAMP(3),
    "metadata" JSONB,
    "credited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wallet_topups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_topups_wallet_id_idx" ON "wallet_topups"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_topups_status_idx" ON "wallet_topups"("status");

-- CreateIndex
CREATE INDEX "wallet_topups_payment_address_idx" ON "wallet_topups"("payment_address");

-- AddForeignKey
ALTER TABLE "wallet_topups" ADD CONSTRAINT "wallet_topups_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "user_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
