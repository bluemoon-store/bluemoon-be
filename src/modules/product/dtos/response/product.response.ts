import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { DeliveryType, Product, ProductImage } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
    IsString,
    IsBoolean,
    IsInt,
    IsDate,
    IsOptional,
    IsUUID,
    IsEnum,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { CategoryResponseDto } from './category.response';

export class ProductImageResponseDto implements ProductImage {
    @ApiProperty({
        example: faker.string.uuid(),
    })
    @Expose()
    @IsUUID()
    id: string;

    @ApiProperty({
        example: faker.string.uuid(),
    })
    @Expose()
    @IsUUID()
    productId: string;

    @ApiProperty({
        example: 'products/images/product-123.jpg',
    })
    @Expose()
    @IsString()
    key: string;

    @ApiPropertyOptional({
        example:
            'https://s3.amazonaws.com/bucket/products/images/product-123.jpg',
        nullable: true,
    })
    @Expose()
    @IsOptional()
    @IsString()
    url: string | null;

    @ApiProperty({
        example: false,
    })
    @Expose()
    @IsBoolean()
    isPrimary: boolean;

    @ApiProperty({
        example: 0,
    })
    @Expose()
    @IsInt()
    sortOrder: number;

    @ApiProperty({
        example: faker.date.past().toISOString(),
    })
    @Expose()
    @IsDate()
    createdAt: Date;

    @ApiProperty({
        example: faker.date.recent().toISOString(),
    })
    @Expose()
    @IsDate()
    updatedAt: Date;

    @ApiPropertyOptional({
        example: null,
        nullable: true,
    })
    @Expose()
    @IsOptional()
    @IsDate()
    deletedAt: Date | null;
}

export class ProductResponseDto implements Product {
    @ApiProperty({
        example: faker.string.uuid(),
    })
    @Expose()
    @IsUUID()
    id: string;

    @ApiProperty({
        example: faker.commerce.productName(),
    })
    @Expose()
    @IsString()
    name: string;

    @ApiProperty({
        example: faker.helpers.slugify(faker.commerce.productName()),
    })
    @Expose()
    @IsString()
    slug: string;

    @ApiProperty({
        example: faker.commerce.productDescription(),
    })
    @Expose()
    @IsString()
    description: string;

    @ApiProperty({
        example: '99.99',
    })
    @Expose()
    @IsString()
    price: any; // Prisma Decimal type (serialized as string)

    @ApiProperty({
        example: 'USD',
    })
    @Expose()
    @IsString()
    currency: string;

    @ApiProperty({
        example: 100,
    })
    @Expose()
    @IsInt()
    stockQuantity: number;

    @ApiProperty({
        example: true,
    })
    @Expose()
    @IsBoolean()
    isActive: boolean;

    @ApiProperty({
        example: false,
    })
    @Expose()
    @IsBoolean()
    isFeatured: boolean;

    @ApiProperty({
        example: faker.string.uuid(),
    })
    @Expose()
    @IsUUID()
    categoryId: string;

    @ApiProperty({
        enum: DeliveryType,
        example: DeliveryType.INSTANT,
    })
    @Expose()
    @IsEnum(DeliveryType)
    deliveryType: DeliveryType;

    @ApiPropertyOptional({
        example: 'Your product key: ABC123XYZ',
        nullable: true,
    })
    @Expose()
    @IsOptional()
    @IsString()
    deliveryContent: string | null;

    @ApiProperty({
        example: faker.date.past().toISOString(),
    })
    @Expose()
    @IsDate()
    createdAt: Date;

    @ApiProperty({
        example: faker.date.recent().toISOString(),
    })
    @Expose()
    @IsDate()
    updatedAt: Date;

    @ApiPropertyOptional({
        example: null,
        nullable: true,
    })
    @Expose()
    @IsOptional()
    @IsDate()
    deletedAt: Date | null;

    @ApiPropertyOptional({
        type: CategoryResponseDto,
    })
    @Expose()
    @IsOptional()
    @Type(() => CategoryResponseDto)
    @ValidateNested()
    category?: CategoryResponseDto;

    @ApiPropertyOptional({
        type: [ProductImageResponseDto],
    })
    @Expose()
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductImageResponseDto)
    images?: ProductImageResponseDto[];
}

export class ProductListResponseDto extends ProductResponseDto {
    @ApiPropertyOptional({
        type: CategoryResponseDto,
    })
    @Expose()
    @IsOptional()
    @Type(() => CategoryResponseDto)
    @ValidateNested()
    category?: CategoryResponseDto;

    @ApiPropertyOptional({
        type: [ProductImageResponseDto],
    })
    @Expose()
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductImageResponseDto)
    images?: ProductImageResponseDto[];
}
