-- AlterTable
ALTER TABLE "users" ADD COLUMN     "flagged_at" TIMESTAMP(3),
ADD COLUMN     "flagged_reason" TEXT,
ADD COLUMN     "is_flagged" BOOLEAN NOT NULL DEFAULT false;
