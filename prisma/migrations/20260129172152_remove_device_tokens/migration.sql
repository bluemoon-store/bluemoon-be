/*
  Warnings:

  - You are about to drop the column `referral_code` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `referred_by` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `sparks` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `device_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `energy_maps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `post_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spark_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "device_tokens" DROP CONSTRAINT "device_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "energy_maps" DROP CONSTRAINT "energy_maps_user_id_fkey";

-- DropForeignKey
ALTER TABLE "images" DROP CONSTRAINT "images_user_id_fkey";

-- DropForeignKey
ALTER TABLE "post_images" DROP CONSTRAINT "post_images_post_id_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_fkey";

-- DropForeignKey
ALTER TABLE "spark_transactions" DROP CONSTRAINT "spark_transactions_user_id_fkey";

-- DropIndex
DROP INDEX "users_referral_code_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "referral_code",
DROP COLUMN "referred_by",
DROP COLUMN "sparks";

-- DropTable
DROP TABLE "device_tokens";

-- DropTable
DROP TABLE "energy_maps";

-- DropTable
DROP TABLE "images";

-- DropTable
DROP TABLE "post_images";

-- DropTable
DROP TABLE "posts";

-- DropTable
DROP TABLE "spark_transactions";

-- DropEnum
DROP TYPE "EnergyMapFocus";

-- DropEnum
DROP TYPE "EnergyMapStatus";

-- DropEnum
DROP TYPE "Platform";

-- DropEnum
DROP TYPE "PostStatus";

-- DropEnum
DROP TYPE "SparkTransactionType";
