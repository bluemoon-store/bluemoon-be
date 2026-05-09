-- CreateEnum
CREATE TYPE "VouchStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterEnum
ALTER TYPE "ActivityLogCategory" ADD VALUE 'VOUCH';

-- AlterTable
ALTER TABLE "vouches" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "status" "VouchStatus" NOT NULL DEFAULT 'PENDING';

-- Preserve storefront visibility for rows that were already public (non-deleted)
UPDATE "vouches"
SET status = 'APPROVED', approved_at = created_at
WHERE deleted_at IS NULL;

-- CreateIndex
CREATE INDEX "vouches_status_idx" ON "vouches"("status");
