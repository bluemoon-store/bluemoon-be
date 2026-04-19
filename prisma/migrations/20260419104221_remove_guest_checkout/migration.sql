/*
  Warnings:

  - You are about to drop the column `guest_email` on the `orders` table. All the data in the column will be lost.
  - Made the column `user_id` on table `orders` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";

-- Remove legacy guest rows (no user) so user_id can be NOT NULL
DELETE FROM "orders" WHERE "user_id" IS NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN IF EXISTS "guest_email",
ALTER COLUMN "user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
