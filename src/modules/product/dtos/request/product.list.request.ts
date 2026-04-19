import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters for listing products
 */
export class ProductListQueryDto {
    @ApiPropertyOptional({
        description: 'Page number',
        example: 1,
        type: Number,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({
        description: 'Items per page',
        example: 10,
        type: Number,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional({
        description: 'Filter by category ID',
        example: 'uuid',
    })
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({
        description: 'Filter by category slug',
        example: 'gaming-items',
    })
    @IsOptional()
    @IsString()
    categorySlug?: string;

    @ApiPropertyOptional({
        description: 'Filter by active status',
        example: true,
        type: Boolean,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Filter by featured status',
        example: false,
        type: Boolean,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional({
        description: 'Hot selling products',
        type: Boolean,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isHot?: boolean;

    @ApiPropertyOptional({
        description: 'Newly launched products',
        type: Boolean,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isNew?: boolean;

    @ApiPropertyOptional({
        description: 'Freshly restocked products',
        type: Boolean,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isRestocked?: boolean;
}
