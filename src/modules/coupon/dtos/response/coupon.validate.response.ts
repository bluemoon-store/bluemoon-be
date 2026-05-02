import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponCategoryScope, CouponDiscountType } from '@prisma/client';

export type CouponInvalidateReason =
    | 'NOT_FOUND'
    | 'EXPIRED'
    | 'INACTIVE'
    | 'EXHAUSTED'
    | 'CATEGORY_MISMATCH';

export class CouponValidateResponseDto {
    @ApiProperty({ example: true })
    valid: boolean;

    @ApiPropertyOptional({
        enum: [
            'NOT_FOUND',
            'EXPIRED',
            'INACTIVE',
            'EXHAUSTED',
            'CATEGORY_MISMATCH',
        ],
    })
    reason?: CouponInvalidateReason;

    @ApiPropertyOptional()
    code?: string;

    @ApiPropertyOptional({ enum: CouponDiscountType })
    discountType?: CouponDiscountType;

    @ApiPropertyOptional({ example: 25 })
    discountValue?: number;

    @ApiPropertyOptional({ enum: CouponCategoryScope })
    categoryScope?: CouponCategoryScope;

    @ApiPropertyOptional({ type: [String] })
    categoryIds?: string[];
}
