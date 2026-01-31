/**
 * Commerce utilities for cart and order (line items with product price/quantity).
 */

/**
 * Item shape for total calculation (cart item or order item with product).
 * price can be string, number, or Prisma Decimal (coerced via Number()).
 */
export interface CommerceLineItem {
    quantity: number;
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
        if (item.product && item.product.price) {
            const price =
                typeof item.product.price === 'string'
                    ? parseFloat(item.product.price)
                    : Number(item.product.price);
            totalAmount += price * item.quantity;
            totalItems += item.quantity;
        }
    }

    return {
        totalAmount: totalAmount.toFixed(8), // Support crypto decimals
        currency,
        totalItems,
    };
}
