-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verification_token" TEXT,
ADD COLUMN     "email_verification_token_expiry" TIMESTAMP(3),
ADD COLUMN     "password_reset_otp" TEXT,
ADD COLUMN     "password_reset_otp_expiry" TIMESTAMP(3);
