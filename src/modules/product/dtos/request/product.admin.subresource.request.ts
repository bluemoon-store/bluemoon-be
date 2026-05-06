import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsUUID,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    IsArray,
    ValidateIf,
} from 'class-validator';

export class AdminProductVariantCreateDto {
    @ApiProperty({ example: '$50 Points | Fully Unlocked' })
    @IsString()
    label: string;

    @ApiProperty({ example: '99.99' })
    @IsString()
    price: string;

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

export class AdminProductRelatedSetDto {
    @ApiProperty({
        type: [String],
        description: 'Related product IDs (replaces existing relations)',
    })
    @IsArray()
    @IsUUID('4', { each: true })
    relatedProductIds: string[];
}

export class AdminProductImageCreateDto {
    @ApiPropertyOptional({
        example: 'products/images/product-123.jpg',
        description: 'Image key (preferred field for admin web clients)',
    })
    @IsOptional()
    @IsString()
    key?: string;

    @ApiPropertyOptional({
        example: 'products/images/product-123.jpg',
        description: 'Legacy image key field for backward compatibility',
    })
    @ValidateIf(o => o.key === undefined)
    @IsString()
    imageKey?: string;

    @ApiPropertyOptional({
        example: false,
        description: 'Whether this image should be primary',
    })
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;
}
