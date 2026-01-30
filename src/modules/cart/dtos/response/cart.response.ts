import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { Cart, CartItem } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
    IsString,
    IsInt,
    IsDate,
    IsUUID,
    IsArray,
    ValidateNested,
    IsOptional,
} from 'class-validator';
import { ProductListResponseDto } from 'src/modules/product/dtos/response/product.response';

export class CartItemResponseDto implements CartItem {
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
    cartId: string;

    @ApiProperty({
        example: faker.string.uuid(),
    })
    @Expose()
    @IsUUID()
    productId: string;

    @ApiProperty({
        example: 2,
    })
    @Expose()
    @IsInt()
    quantity: number;

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
        type: ProductListResponseDto,
    })
    @Expose()
    @IsOptional()
    @Type(() => ProductListResponseDto)
    @ValidateNested()
    product?: ProductListResponseDto;
}

export class CartResponseDto implements Cart {
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
    userId: string;

    @ApiProperty({
        type: [CartItemResponseDto],
    })
    @Expose()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartItemResponseDto)
    items: CartItemResponseDto[];

    @ApiProperty({
        example: '199.98',
        description: 'Total amount of all items in cart',
    })
    @Expose()
    @IsString()
    totalAmount: string;

    @ApiProperty({
        example: 'USD',
        description: 'Currency of the cart',
    })
    @Expose()
    @IsString()
    currency: string;

    @ApiProperty({
        example: 2,
        description: 'Total number of items in cart',
    })
    @Expose()
    @IsInt()
    totalItems: number;

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
}
