import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { IsUUID, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CartAddItemDto {
    @ApiProperty({
        example: faker.string.uuid(),
        description: 'Product ID to add to cart',
    })
    @IsUUID()
    productId: string;

    @ApiProperty({
        example: 1,
        default: 1,
        description: 'Quantity to add',
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
