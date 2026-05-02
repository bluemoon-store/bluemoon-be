import { Coupon, CouponCategory, ProductCategory } from '@prisma/client';

export type CouponWithCategories = Coupon & {
    categories: (CouponCategory & {
        category: Pick<ProductCategory, 'id' | 'name' | 'slug'>;
    })[];
};
