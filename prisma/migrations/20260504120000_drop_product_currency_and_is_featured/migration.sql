-- Drop product merchandising / multi-currency columns (storefront uses USD only).

ALTER TABLE "products" DROP COLUMN "currency";
ALTER TABLE "products" DROP COLUMN "is_featured";
ALTER TABLE "product_variants" DROP COLUMN "currency";
