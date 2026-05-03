import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponCategoryScope, CouponDiscountType } from '@prisma/client';

export type CouponInvalidateReason =
    | 'NOT_FOUND'
    | 'EXPIRED'
    | 'INACTIVE'
    | 'EXHAUSTED'
    | 'CATEGORY_MISMATCH'
    | 'CART_EMPTY';

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
            'CART_EMPTY',
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

export class CouponPreviewResponseDto extends CouponValidateResponseDto {
    @ApiPropertyOptional({
        description: 'Cart subtotal before discount (8 dp decimal string)',
        example: '20.00000000',
    })
    subtotal?: string;

    @ApiPropertyOptional({
        description: 'Subtotal of lines the coupon applies to (8 dp)',
        example: '20.00000000',
    })
    applicableSubtotal?: string;

    @ApiPropertyOptional({
        description: 'Discount in currency units (8 dp); zero when invalid',
        example: '2.00000000',
    })
    discountAmount?: string;

    @ApiPropertyOptional({ nullable: true })
    description?: string | null;
}
