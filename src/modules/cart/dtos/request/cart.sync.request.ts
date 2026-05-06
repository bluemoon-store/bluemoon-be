import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import {
    IsArray,
    IsInt,
    IsOptional,
    IsUUID,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CartSyncItemDto {
    @ApiProperty({
        example: faker.string.uuid(),
        description: 'Product ID to sync to cart',
    })
    @IsUUID()
    productId: string;

    @ApiProperty({
        example: 1,
        default: 1,
        description: 'Quantity to set for item',
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    @Max(1000)
    quantity: number;

    @ApiPropertyOptional({
        description: 'Selected product variant',
    })
    @IsOptional()
    @IsUUID()
    variantId?: string;
}

export class CartSyncDto {
    @ApiProperty({
        type: CartSyncItemDto,
        isArray: true,
        description: 'Complete cart items to replace existing cart state',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartSyncItemDto)
    items: CartSyncItemDto[];
}
