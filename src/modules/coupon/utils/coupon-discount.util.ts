import {
    CouponCategoryScope,
    CouponDiscountType,
    Prisma,
} from '@prisma/client';

export type CouponLineItem = { categoryId: string; lineSubtotal: number };

export type DiscountResult = {
    subtotal: number;
    applicableSubtotal: number;
    discountAmount: number;
};

function roundMoney8(value: number): number {
    return Math.round((value + Number.EPSILON) * 1e8) / 1e8;
}

function toNumber(
    v: Prisma.Decimal | number | string | { toString(): string }
): number {
    if (typeof v === 'number') {
        return v;
    }
    return Number(v);
}

/**
 * Server-authoritative discount for cart/order line items.
 * Caps discount at applicable in-scope subtotal; never negative.
 */
export function calculateCouponDiscount(
    coupon: {
        discountType: CouponDiscountType;
        discountValue: Prisma.Decimal | number;
        categoryScope: CouponCategoryScope;
        categoryIds: string[];
    },
    items: CouponLineItem[]
): DiscountResult {
    const subtotal = roundMoney8(
        items.reduce((sum, i) => sum + i.lineSubtotal, 0)
    );

    const allowed =
        coupon.categoryScope === CouponCategoryScope.ALL
            ? null
            : new Set(coupon.categoryIds);

    const applicableSubtotal = roundMoney8(
        allowed == null
            ? subtotal
            : items.reduce(
                  (sum, i) =>
                      allowed.has(i.categoryId) ? sum + i.lineSubtotal : sum,
                  0
              )
    );

    const dv = toNumber(coupon.discountValue);
    let raw =
        coupon.discountType === CouponDiscountType.PERCENT
            ? applicableSubtotal * (dv / 100)
            : Math.min(dv, applicableSubtotal);

    raw = Math.min(Math.max(raw, 0), applicableSubtotal);
    const discountAmount = roundMoney8(raw);

    return { subtotal, applicableSubtotal, discountAmount };
}
