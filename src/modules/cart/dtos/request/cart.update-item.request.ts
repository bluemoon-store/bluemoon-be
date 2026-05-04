import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class CartUpdateItemDto {
    @ApiProperty({
        example: 2,
        description: 'New quantity for the cart item',
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    @Max(1000)
    quantity: number;
}
