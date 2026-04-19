import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';

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
