import { ApiProperty } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { IsInt, Min } from 'class-validator';

export class CartUpdateItemDto {
    @ApiProperty({
        example: 2,
        description: 'New quantity for the cart item',
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    quantity: number;
}
