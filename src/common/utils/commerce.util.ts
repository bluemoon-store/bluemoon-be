import { Prisma } from '@prisma/client';

/**
 * Commerce utilities for cart and order (line items with product price/quantity).
 */

function coercePrice(
    value: string | number | Prisma.Decimal | unknown
): number {
    if (value === null || value === undefined) {
        return 0;
    }
    if (typeof value === 'string') {
        return parseFloat(value);
    }
    if (typeof value === 'number') {
        return value;
    }
    return Number(value);
}

/**
 * Item shape for total calculation (cart item or order item with product).
 * price can be string, number, or Prisma Decimal (coerced via Number()).
 */
export interface CommerceLineItem {
    quantity: number;
    unitPrice?: string | number | Prisma.Decimal | null;
    product?: {
        price?: string | number | unknown;
        currency?: string;
    };
}

export interface CommerceTotalsResult {
    totalAmount: string;
    currency: string;
    totalItems: number;
}

/**
 * Calculate totals from line items (cart or order items with product price and quantity).
 *
 * @param items - Items with product (price, currency) and quantity
 * @returns totalAmount (string, 8 decimals for crypto), currency, and totalItems count
 */
export function calculateLineItemsTotals(
    items: CommerceLineItem[]
): CommerceTotalsResult {
    if (!items || items.length === 0) {
        return {
            totalAmount: '0',
            currency: 'USD',
            totalItems: 0,
        };
    }

    const currency = items[0]?.product?.currency || 'USD';
    let totalAmount = 0;
    let totalItems = 0;

    for (const item of items) {
        const lineUnit =
            item.unitPrice != null && item.unitPrice !== undefined
                ? coercePrice(item.unitPrice)
                : item.product?.price != null
                  ? coercePrice(item.product.price)
                  : 0;

        if (lineUnit > 0) {
            totalAmount += lineUnit * item.quantity;
            totalItems += item.quantity;
        }
    }

    return {
        totalAmount: totalAmount.toFixed(8), // Support crypto decimals
        currency,
        totalItems,
    };
}
