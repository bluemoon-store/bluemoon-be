import { Prisma } from '@prisma/client';

export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

type ImageLike = {
    url: string | null;
    isPrimary: boolean;
    sortOrder: number;
};

export function computePrimaryImageUrl(images: ImageLike[]): string | null {
    if (!images?.length) {
        return null;
    }
    const primary = images.find(i => i.isPrimary && i.url);
    if (primary?.url) {
        return primary.url;
    }
    const firstWithUrl = images.find(i => i.url);
    return firstWithUrl?.url ?? null;
}

export function decimalToString(
    value: Prisma.Decimal | string | number | { toString(): string }
): string {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number') {
        return String(value);
    }
    return value.toString();
}

type VariantPriceLike = {
    price: Prisma.Decimal | string | number;
    isActive: boolean;
    deletedAt: Date | null;
};

export function computeFromPrice(
    basePrice: Prisma.Decimal | string | number,
    variants: VariantPriceLike[]
): string {
    const active =
        variants?.filter(v => v.isActive && v.deletedAt === null) ?? [];
    if (active.length === 0) {
        return decimalToString(basePrice);
    }
    let min: Prisma.Decimal | null = null;
    for (const v of active) {
        const d = new Prisma.Decimal(decimalToString(v.price));
        if (!min || d.lessThan(min)) {
            min = d;
        }
    }
    return min ? min.toFixed(8) : decimalToString(basePrice);
}

export function buildProductTags(product: {
    isHot: boolean;
    isNew: boolean;
    isNFA: boolean;
}): string[] {
    const tags: string[] = [];
    if (product.isHot) {
        tags.push('Hot');
    }
    if (product.isNew) {
        tags.push('New');
    }
    if (product.isNFA) {
        tags.push('NFA');
    }
    return tags;
}
