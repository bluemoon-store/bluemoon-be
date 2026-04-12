-- DropIndex
DROP INDEX "cart_items_cart_id_product_id_key";

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "region_country" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "region_label" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "unit_price" DECIMAL(20,8),
ADD COLUMN     "variant_id" TEXT;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "region_country" TEXT,
ADD COLUMN     "region_label" TEXT,
ADD COLUMN     "variant_id" TEXT,
ADD COLUMN     "variant_label" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "country_of_origin" TEXT,
ADD COLUMN     "is_hot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_new" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_nfa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_restocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "launched_at" TIMESTAMP(3),
ADD COLUMN     "redeem_process" TEXT,
ADD COLUMN     "restocked_at" TIMESTAMP(3),
ADD COLUMN     "short_notice" TEXT,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "warranty_text" TEXT;

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_regions" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "country_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_related" (
    "product_id" TEXT NOT NULL,
    "related_product_id" TEXT NOT NULL,

    CONSTRAINT "product_related_pkey" PRIMARY KEY ("product_id","related_product_id")
);

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "product_regions_product_id_idx" ON "product_regions"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_regions_product_id_label_key" ON "product_regions"("product_id", "label");

-- CreateIndex
CREATE INDEX "cart_items_variant_id_idx" ON "cart_items"("variant_id");

-- CreateIndex
CREATE INDEX "order_items_variant_id_idx" ON "order_items"("variant_id");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_regions" ADD CONSTRAINT "product_regions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_related" ADD CONSTRAINT "product_related_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_related" ADD CONSTRAINT "product_related_related_product_id_fkey" FOREIGN KEY ("related_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
