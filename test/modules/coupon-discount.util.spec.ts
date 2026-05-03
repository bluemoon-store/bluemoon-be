import { CouponCategoryScope, CouponDiscountType } from '@prisma/client';

import { calculateCouponDiscount } from 'src/modules/coupon/utils/coupon-discount.util';

describe('calculateCouponDiscount', () => {
    const catA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const catB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    it('PERCENT + ALL applies to full subtotal', () => {
        const r = calculateCouponDiscount(
            {
                discountType: CouponDiscountType.PERCENT,
                discountValue: 10,
                categoryScope: CouponCategoryScope.ALL,
                categoryIds: [],
            },
            [
                { categoryId: catA, lineSubtotal: 10 },
                { categoryId: catB, lineSubtotal: 10 },
            ]
        );
        expect(r.subtotal).toBe(20);
        expect(r.applicableSubtotal).toBe(20);
        expect(r.discountAmount).toBe(2);
    });

    it('FIXED + ALL caps at subtotal', () => {
        const r = calculateCouponDiscount(
            {
                discountType: CouponDiscountType.FIXED,
                discountValue: 5,
                categoryScope: CouponCategoryScope.ALL,
                categoryIds: [],
            },
            [{ categoryId: catA, lineSubtotal: 3 }]
        );
        expect(r.subtotal).toBe(3);
        expect(r.applicableSubtotal).toBe(3);
        expect(r.discountAmount).toBe(3);
    });

    it('PERCENT + SPECIFIC only on matching lines', () => {
        const r = calculateCouponDiscount(
            {
                discountType: CouponDiscountType.PERCENT,
                discountValue: 25,
                categoryScope: CouponCategoryScope.SPECIFIC,
                categoryIds: [catA],
            },
            [
                { categoryId: catA, lineSubtotal: 40 },
                { categoryId: catB, lineSubtotal: 60 },
            ]
        );
        expect(r.subtotal).toBe(100);
        expect(r.applicableSubtotal).toBe(40);
        expect(r.discountAmount).toBe(10);
    });

    it('FIXED + SPECIFIC uses applicable subtotal cap', () => {
        const r = calculateCouponDiscount(
            {
                discountType: CouponDiscountType.FIXED,
                discountValue: 100,
                categoryScope: CouponCategoryScope.SPECIFIC,
                categoryIds: [catB],
            },
            [
                { categoryId: catA, lineSubtotal: 50 },
                { categoryId: catB, lineSubtotal: 20 },
            ]
        );
        expect(r.applicableSubtotal).toBe(20);
        expect(r.discountAmount).toBe(20);
    });

    it('never returns negative discount', () => {
        const r = calculateCouponDiscount(
            {
                discountType: CouponDiscountType.FIXED,
                discountValue: 0,
                categoryScope: CouponCategoryScope.ALL,
                categoryIds: [],
            },
            [{ categoryId: catA, lineSubtotal: 5 }]
        );
        expect(r.discountAmount).toBe(0);
    });
});
