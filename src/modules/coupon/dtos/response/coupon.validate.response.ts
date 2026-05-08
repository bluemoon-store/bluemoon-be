import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponCategoryScope, CouponDiscountType } from '@prisma/client';
import { Expose } from 'class-transformer';

export type CouponInvalidateReason =
    | 'NOT_FOUND'
    | 'EXPIRED'
    | 'INACTIVE'
    | 'EXHAUSTED'
    | 'CATEGORY_MISMATCH'
    | 'CART_EMPTY';

export class CouponValidateResponseDto {
    @ApiProperty({ example: true })
    @Expose()
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
    @Expose()
    reason?: CouponInvalidateReason;

    @ApiPropertyOptional()
    @Expose()
    code?: string;

    @ApiPropertyOptional({ enum: CouponDiscountType })
    @Expose()
    discountType?: CouponDiscountType;

    @ApiPropertyOptional({ example: 25 })
    @Expose()
    discountValue?: number;

    @ApiPropertyOptional({ enum: CouponCategoryScope })
    @Expose()
    categoryScope?: CouponCategoryScope;

    @ApiPropertyOptional({ type: [String] })
    @Expose()
    categoryIds?: string[];
}

export class CouponPreviewResponseDto extends CouponValidateResponseDto {
    @ApiPropertyOptional({
        description: 'Cart subtotal before discount (8 dp decimal string)',
        example: '20.00000000',
    })
    @Expose()
    subtotal?: string;

    @ApiPropertyOptional({
        description: 'Subtotal of lines the coupon applies to (8 dp)',
        example: '20.00000000',
    })
    @Expose()
    applicableSubtotal?: string;

    @ApiPropertyOptional({
        description: 'Discount in currency units (8 dp); zero when invalid',
        example: '2.00000000',
    })
    @Expose()
    discountAmount?: string;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    description?: string | null;
}
