-- CreateTable
CREATE TABLE "vouches" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_key" TEXT NOT NULL,
    "image_url" TEXT,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vouches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vouches_order_item_id_idx" ON "vouches"("order_item_id");

-- CreateIndex
CREATE INDEX "vouches_user_id_idx" ON "vouches"("user_id");

-- CreateIndex
CREATE INDEX "vouches_created_at_idx" ON "vouches"("created_at");

-- AddForeignKey
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
