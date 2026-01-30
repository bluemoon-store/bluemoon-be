import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class OrderStatusUpdateDto {
    @ApiProperty({
        enum: OrderStatus,
        example: OrderStatus.PROCESSING,
        description: 'New order status',
    })
    @IsEnum(OrderStatus)
    status: OrderStatus;
}
