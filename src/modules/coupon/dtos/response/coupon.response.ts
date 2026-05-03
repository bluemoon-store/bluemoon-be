import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponCategoryScope, CouponDiscountType } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDate,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';

export class CouponCategorySummaryDto {
    @ApiProperty()
    @Expose()
    @IsUUID()
    id: string;

    @ApiProperty()
    @Expose()
    @IsString()
    name: string;

    @ApiProperty()
    @Expose()
    @IsString()
    slug: string;
}

export class CouponListResponseDto {
    @ApiProperty()
    @Expose()
    @IsUUID()
    id: string;

    @ApiProperty()
    @Expose()
    @IsString()
    code: string;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    @IsOptional()
    @IsString()
    description?: string | null;

    @ApiProperty({ enum: ['active', 'expired'] })
    @Expose()
    @IsString()
    status: 'active' | 'expired';

    @ApiProperty({ enum: CouponDiscountType })
    @Expose()
    @IsEnum(CouponDiscountType)
    discountType: CouponDiscountType;

    @ApiProperty({ example: 25 })
    @Expose()
    discountValue: number;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    @IsOptional()
    @IsDate()
    expiresAt: Date | null;

    @ApiPropertyOptional({ nullable: true, example: 12 })
    @Expose()
    @IsOptional()
    @IsInt()
    daysRemaining: number | null;

    @ApiProperty({ enum: CouponCategoryScope })
    @Expose()
    @IsEnum(CouponCategoryScope)
    categoryScope: CouponCategoryScope;

    @ApiProperty({ type: [CouponCategorySummaryDto] })
    @Expose()
    @Type(() => CouponCategorySummaryDto)
    @IsArray()
    @ValidateNested({ each: true })
    categories: CouponCategorySummaryDto[];

    @ApiProperty()
    @Expose()
    @IsInt()
    usedCount: number;

    @ApiPropertyOptional({ nullable: true })
    @Expose()
    @IsOptional()
    @IsInt()
    maxUses: number | null;

    @ApiProperty()
    @Expose()
    @IsBoolean()
    isActive: boolean;

    @ApiProperty()
    @Expose()
    @IsDate()
    createdAt: Date;
}

export class CouponResponseDto extends CouponListResponseDto {
    @ApiProperty()
    @Expose()
    @IsDate()
    updatedAt: Date;
}
