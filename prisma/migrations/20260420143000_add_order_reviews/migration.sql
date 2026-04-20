-- Create review status enum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create order reviews table
CREATE TABLE "order_reviews" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "order_reviews_pkey" PRIMARY KEY ("id")
);

-- One review per order
CREATE UNIQUE INDEX "order_reviews_order_id_key" ON "order_reviews"("order_id");
CREATE INDEX "order_reviews_user_id_idx" ON "order_reviews"("user_id");
CREATE INDEX "order_reviews_status_idx" ON "order_reviews"("status");

-- Foreign keys
ALTER TABLE "order_reviews"
ADD CONSTRAINT "order_reviews_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_reviews"
ADD CONSTRAINT "order_reviews_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
