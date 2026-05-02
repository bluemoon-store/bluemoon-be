-- CreateEnum
CREATE TYPE "ActivityLogCategory" AS ENUM ('PRODUCT', 'PRODUCT_CATEGORY', 'ORDER', 'USER', 'COUPON', 'WALLET', 'CRYPTO_PAYMENT', 'REVIEW', 'CONTENT', 'SETTINGS');

-- CreateEnum
CREATE TYPE "ActivityLogSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ActivityLogStatus" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_email" TEXT,
    "actor_name" TEXT,
    "actor_role" "Role",
    "action" TEXT NOT NULL,
    "category" "ActivityLogCategory" NOT NULL,
    "severity" "ActivityLogSeverity" NOT NULL DEFAULT 'INFO',
    "resource_type" TEXT,
    "resource_id" TEXT,
    "resource_label" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" VARCHAR(512),
    "request_id" TEXT,
    "status" "ActivityLogStatus" NOT NULL DEFAULT 'SUCCESS',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_actor_id_created_at_idx" ON "activity_logs"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_resource_type_resource_id_created_at_idx" ON "activity_logs"("resource_type", "resource_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_category_created_at_idx" ON "activity_logs"("category", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_action_created_at_idx" ON "activity_logs"("action", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
