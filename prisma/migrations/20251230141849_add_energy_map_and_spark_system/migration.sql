/*
  Warnings:

  - A unique constraint covering the columns `[referral_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EnergyMapFocus" AS ENUM ('INNER_NATURE', 'CAREER_PATH', 'RELATIONSHIPS', 'LIFE_DIRECTION');

-- CreateEnum
CREATE TYPE "EnergyMapType" AS ENUM ('SIMPLE', 'DEEP');

-- CreateEnum
CREATE TYPE "EnergyMapStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SparkTransactionType" AS ENUM ('REFERRAL_BONUS', 'DAILY_RETURN', 'PURCHASE', 'DEEP_MAP_UNLOCK');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "referral_code" TEXT,
ADD COLUMN     "referred_by" TEXT,
ADD COLUMN     "sparks" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "energy_maps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "focus" "EnergyMapFocus" NOT NULL,
    "map_type" "EnergyMapType" NOT NULL DEFAULT 'SIMPLE',
    "status" "EnergyMapStatus" NOT NULL DEFAULT 'PROCESSING',
    "name" TEXT,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "core_pattern" TEXT,
    "strengths" TEXT[],
    "challenges" TEXT[],
    "career_tendencies" TEXT[],
    "relationship_patterns" TEXT[],
    "left_palm_image_key" TEXT,
    "right_palm_image_key" TEXT,
    "face_image_key" TEXT,
    "pattern_explanation" TEXT,
    "timing_insights" TEXT,
    "evolution_path" TEXT,
    "adjustment_strategies" TEXT[],
    "sparks_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "energy_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spark_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "SparkTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "spark_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "energy_maps_user_id_idx" ON "energy_maps"("user_id");

-- CreateIndex
CREATE INDEX "energy_maps_focus_idx" ON "energy_maps"("focus");

-- CreateIndex
CREATE INDEX "energy_maps_status_idx" ON "energy_maps"("status");

-- CreateIndex
CREATE INDEX "spark_transactions_user_id_idx" ON "spark_transactions"("user_id");

-- CreateIndex
CREATE INDEX "spark_transactions_type_idx" ON "spark_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- AddForeignKey
ALTER TABLE "energy_maps" ADD CONSTRAINT "energy_maps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spark_transactions" ADD CONSTRAINT "spark_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
