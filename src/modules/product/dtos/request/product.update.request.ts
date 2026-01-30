import { ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { DeliveryType } from '@prisma/client';
import {
    IsString,
    IsUUID,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    MaxLength,
    IsEnum,
} from 'class-validator';

export class ProductUpdateDto {
    @ApiPropertyOptional({
        example: faker.commerce.productName(),
        description: 'Product name',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @ApiPropertyOptional({
        example: faker.helpers.slugify(faker.commerce.productName()),
        description: 'URL-friendly slug',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    slug?: string;

    @ApiPropertyOptional({
        example: faker.commerce.productDescription(),
        description: 'Product description',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        example: '99.99',
        description: 'Product price in base currency',
    })
    @IsOptional()
    @IsString()
    price?: string;

    @ApiPropertyOptional({
        example: 'USD',
        description: 'Base currency',
    })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    currency?: string;

    @ApiPropertyOptional({
        example: 100,
        description: 'Stock quantity',
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    stockQuantity?: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether the product is active',
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        example: false,
        description: 'Whether the product is featured',
    })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional({
        example: faker.string.uuid(),
        description: 'Category ID',
    })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({
        enum: DeliveryType,
        description: 'Delivery type',
    })
    @IsOptional()
    @IsEnum(DeliveryType)
    deliveryType?: DeliveryType;

    @ApiPropertyOptional({
        example: 'Your product key: ABC123XYZ',
        description: 'Content for instant delivery',
    })
    @IsOptional()
    @IsString()
    deliveryContent?: string;
}
