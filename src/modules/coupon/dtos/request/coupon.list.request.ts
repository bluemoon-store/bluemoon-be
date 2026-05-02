import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';

export enum CouponListStatusFilter {
    ALL = 'all',
    ACTIVE = 'active',
    EXPIRED = 'expired',
}

export class CouponListQueryDto {
    @ApiPropertyOptional({ example: 1, type: Number })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        example: 12,
        description: 'Defaults to 12 in the coupons list API',
        type: Number,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number;

    @ApiPropertyOptional({
        enum: CouponListStatusFilter,
        example: CouponListStatusFilter.ALL,
    })
    @IsOptional()
    @IsEnum(CouponListStatusFilter)
    status?: CouponListStatusFilter;

    @ApiPropertyOptional({
        description: 'Case-insensitive substring match on coupon code',
    })
    @IsOptional()
    @IsString()
    @MaxLength(64)
    query?: string;
}
