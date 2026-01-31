import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductImageDto {
    @ApiProperty({
        example: 'products/images/product-123.jpg',
        description: 'S3 key for the image',
    })
    @IsString()
    key: string;

    @ApiPropertyOptional({
        example: false,
        default: false,
        description: 'Whether this is the primary image',
    })
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;

    @ApiPropertyOptional({
        example: 0,
        default: 0,
        description: 'Sort order for image display',
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;
}

export class ProductCreateDto {
    @ApiProperty({
        example: faker.commerce.productName(),
        description:
            'Product name (can be duplicated; not required to be unique)',
    })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({
        example: faker.helpers.slugify(faker.commerce.productName()),
        description: 'URL-friendly slug (auto-generated if not provided)',
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    slug?: string;

    @ApiProperty({
        example: faker.commerce.productDescription(),
        description: 'Product description',
    })
    @IsString()
    description: string;

    @ApiProperty({
        example: '99.99',
        description: 'Product price in base currency',
    })
    @IsString()
    price: string;

    @ApiPropertyOptional({
        example: 'USD',
        default: 'USD',
        description: 'Base currency',
    })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    currency?: string;

    @ApiPropertyOptional({
        example: 100,
        default: 0,
        description: 'Stock quantity',
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    stockQuantity?: number;

    @ApiPropertyOptional({
        example: true,
        default: true,
        description: 'Whether the product is active',
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        example: false,
        default: false,
        description: 'Whether the product is featured',
    })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiProperty({
        example: faker.string.uuid(),
        description: 'Category ID',
    })
    @IsUUID()
    categoryId: string;

    @ApiPropertyOptional({
        enum: DeliveryType,
        default: DeliveryType.INSTANT,
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

    @ApiPropertyOptional({
        type: [ProductImageDto],
        description: 'Product images',
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductImageDto)
    images?: ProductImageDto[];
}
