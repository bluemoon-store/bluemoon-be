-- Drop product_regions table and remove region snapshot columns from cart_items / order_items.
DROP TABLE "product_regions";

ALTER TABLE "cart_items" DROP COLUMN "region_label";
ALTER TABLE "cart_items" DROP COLUMN "region_country";

ALTER TABLE "order_items" DROP COLUMN "region_label";
ALTER TABLE "order_items" DROP COLUMN "region_country";
