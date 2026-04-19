-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "buyer_protection" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "buyer_protection_amount" DECIMAL(20,8),
ADD COLUMN     "discount_amount" DECIMAL(20,8),
ADD COLUMN     "guest_email" TEXT,
ADD COLUMN     "promo_code" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
