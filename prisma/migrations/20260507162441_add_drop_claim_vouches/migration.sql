-- CreateTable
CREATE TABLE "drop_claim_vouches" (
    "id" TEXT NOT NULL,
    "drop_claim_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_key" TEXT NOT NULL,
    "image_url" TEXT,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "drop_claim_vouches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "drop_claim_vouches_drop_claim_id_idx" ON "drop_claim_vouches"("drop_claim_id");

-- CreateIndex
CREATE INDEX "drop_claim_vouches_user_id_idx" ON "drop_claim_vouches"("user_id");

-- CreateIndex
CREATE INDEX "drop_claim_vouches_created_at_idx" ON "drop_claim_vouches"("created_at");

-- AddForeignKey
ALTER TABLE "drop_claim_vouches" ADD CONSTRAINT "drop_claim_vouches_drop_claim_id_fkey" FOREIGN KEY ("drop_claim_id") REFERENCES "drop_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drop_claim_vouches" ADD CONSTRAINT "drop_claim_vouches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
