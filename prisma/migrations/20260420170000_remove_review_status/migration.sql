-- Drop index tied to status filtering
DROP INDEX IF EXISTS "order_reviews_status_idx";

-- Drop review moderation status column
ALTER TABLE "order_reviews" DROP COLUMN IF EXISTS "status";

-- Drop enum type if no longer used
DROP TYPE IF EXISTS "ReviewStatus";
