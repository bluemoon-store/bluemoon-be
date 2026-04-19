import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsUUID,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    IsArray,
} from 'class-validator';

export class AdminProductVariantCreateDto {
    @ApiProperty({ example: '$50 Points | Fully Unlocked' })
    @IsString()
    label: string;

    @ApiProperty({ example: '99.99' })
    @IsString()
    price: string;

    @ApiPropertyOptional({ default: 'USD' })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    stockQuantity?: number;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}

export class AdminProductVariantUpdateDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    label?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    price?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    stockQuantity?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}

export class AdminProductRegionCreateDto {
    @ApiProperty({ example: 'AB' })
    @IsString()
    label: string;

    @ApiProperty({ example: 'CA' })
    @IsString()
    countryCode: string;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}

export class AdminProductRelatedSetDto {
    @ApiProperty({
        type: [String],
        description: 'Related product IDs (replaces existing relations)',
    })
    @IsArray()
    @IsUUID('4', { each: true })
    relatedProductIds: string[];
}
