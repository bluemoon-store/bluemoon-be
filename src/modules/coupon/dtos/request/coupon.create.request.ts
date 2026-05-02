import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponCategoryScope, CouponDiscountType } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsUUID,
    Matches,
    MaxLength,
    Min,
    MinLength,
    ValidateIf,
} from 'class-validator';

export class CouponCreateDto {
    @ApiProperty({
        example: 'SUMMER25',
        description:
            '3–32 chars, letters, digits, hyphen only (stored uppercase)',
    })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toUpperCase() : value
    )
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(32)
    @Matches(/^[A-Z0-9-]+$/, {
        message: 'code must be A–Z, 0–9, or hyphen only',
    })
    code: string;

    @ApiProperty({
        enum: CouponDiscountType,
        example: CouponDiscountType.PERCENT,
    })
    @IsEnum(CouponDiscountType)
    discountType: CouponDiscountType;

    @ApiProperty({ example: 25 })
    @Type(() => Number)
    @IsNumber()
    discountValue: number;

    @ApiPropertyOptional({
        nullable: true,
        description: 'ISO date string; omit or null for never expires',
        example: '2026-12-31T23:59:59.000Z',
    })
    @IsOptional()
    @ValidateIf((_o, v) => v != null)
    @IsDateString()
    expiresAt?: string | null;

    @ApiPropertyOptional({
        nullable: true,
        description: '>= 1, or null for unlimited uses',
        example: 100,
    })
    @IsOptional()
    @ValidateIf((_o, v) => v != null)
    @Type(() => Number)
    @IsInt()
    @Min(1)
    maxUses?: number | null;

    @ApiProperty({
        enum: CouponCategoryScope,
        example: CouponCategoryScope.ALL,
    })
    @IsEnum(CouponCategoryScope)
    categoryScope: CouponCategoryScope;

    @ApiPropertyOptional({
        description: 'Required when categoryScope is SPECIFIC',
        type: [String],
    })
    @ValidateIf(o => o.categoryScope === CouponCategoryScope.SPECIFIC)
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    categoryIds?: string[];

    @ApiPropertyOptional({ example: true, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
