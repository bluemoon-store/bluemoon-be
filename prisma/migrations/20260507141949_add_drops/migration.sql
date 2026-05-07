-- AlterEnum
ALTER TYPE "ActivityLogCategory" ADD VALUE 'DROP';

-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'CANCELLED';

-- CreateTable
CREATE TABLE "drops" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "claimed_count" INTEGER NOT NULL DEFAULT 0,
    "allowed_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "drops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drop_claims" (
    "id" TEXT NOT NULL,
    "drop_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stock_line_id" TEXT,
    "claimed_content" TEXT NOT NULL,
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drop_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drops_product_id_idx" ON "drops"("product_id");

-- CreateIndex
CREATE INDEX "drops_variant_id_idx" ON "drops"("variant_id");

-- CreateIndex
CREATE INDEX "drops_is_active_expires_at_idx" ON "drops"("is_active", "expires_at");

-- CreateIndex
CREATE INDEX "drops_deleted_at_idx" ON "drops"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "drop_claims_stock_line_id_key" ON "drop_claims"("stock_line_id");

-- CreateIndex
CREATE INDEX "drop_claims_user_id_idx" ON "drop_claims"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "drop_claims_drop_id_user_id_key" ON "drop_claims"("drop_id", "user_id");

-- AddForeignKey
ALTER TABLE "drops" ADD CONSTRAINT "drops_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drops" ADD CONSTRAINT "drops_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drop_claims" ADD CONSTRAINT "drop_claims_drop_id_fkey" FOREIGN KEY ("drop_id") REFERENCES "drops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drop_claims" ADD CONSTRAINT "drop_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drop_claims" ADD CONSTRAINT "drop_claims_stock_line_id_fkey" FOREIGN KEY ("stock_line_id") REFERENCES "product_stock_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
