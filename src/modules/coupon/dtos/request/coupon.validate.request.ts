import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

function toOptionalUuidArray(value: unknown): string[] | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    if (Array.isArray(value)) {
        return value as string[];
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
    }
    return undefined;
}

export class CouponValidateQueryDto {
    @ApiProperty({ example: 'SUMMER25' })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toUpperCase() : value
    )
    @IsNotEmpty()
    @IsString()
    code: string;

    @ApiPropertyOptional({
        description:
            'Product category IDs from the cart (required for intersection when coupon is SPECIFIC)',
        type: [String],
    })
    @IsOptional()
    @Transform(({ value }) => toOptionalUuidArray(value))
    @IsArray()
    @IsUUID('4', { each: true })
    categoryIds?: string[];
}
