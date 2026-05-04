import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import {
    IsArray,
    IsInt,
    IsOptional,
    IsString,
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

    @ApiPropertyOptional({
        example: 'AB',
        description: 'Selected region label (snapshot)',
    })
    @IsOptional()
    @IsString()
    regionLabel?: string;

    @ApiPropertyOptional({
        example: 'CA',
        description: 'ISO country code for region (snapshot)',
    })
    @IsOptional()
    @IsString()
    regionCountry?: string;
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
