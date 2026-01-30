import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import { IsString, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class OrderItemDeliveryDto {
    @ApiProperty({
        example: faker.string.uuid(),
        description: 'Order item ID',
    })
    @IsUUID()
    itemId: string;

    @ApiProperty({
        example: 'Your product key: ABC123XYZ',
        description: 'Content to deliver for this item',
    })
    @IsString()
    @MaxLength(5000)
    content: string;
}

export class OrderDeliverDto {
    @ApiProperty({
        type: [OrderItemDeliveryDto],
        description: 'Delivery content for each order item',
    })
    items: OrderItemDeliveryDto[];

    @ApiPropertyOptional({
        example: 'Order delivered successfully',
        description: 'Optional delivery notes',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}
