import { ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { Type } from 'class-transformer';
import {
    IsOptional,
    IsString,
    IsUUID,
    IsBoolean,
    Min,
    IsNumber,
} from 'class-validator';
import { BasePrismaQueryDto } from 'src/common/helper/dtos/query.dto';

export class ProductSearchDto extends BasePrismaQueryDto {
    @ApiPropertyOptional({
        example: faker.commerce.productName(),
        description: 'Search query for product name or description',
    })
    @IsOptional()
    @IsString()
    searchQuery?: string;

    @ApiPropertyOptional({
        example: faker.string.uuid(),
        description: 'Filter by category ID',
    })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Filter by active status',
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Filter by featured status',
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional({
        example: 0,
        description: 'Minimum price filter',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({
        example: 1000,
        description: 'Maximum price filter',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({
        example: 'name',
        description: 'Field to sort by (name, price, createdAt, etc.)',
    })
    @IsOptional()
    @IsString()
    sortBy?: string;
}
