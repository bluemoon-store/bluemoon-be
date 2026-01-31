import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

/**
 * Query parameters for listing all orders (admin)
 */
export class OrderListQueryDto {
    @ApiPropertyOptional({
        description: 'Page number',
        example: 1,
        type: Number,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({
        description: 'Items per page',
        example: 10,
        type: Number,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional({
        description: 'Filter by order status',
        enum: OrderStatus,
    })
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @ApiPropertyOptional({
        description: 'Filter by user ID',
        example: 'uuid',
    })
    @IsOptional()
    @IsString()
    userId?: string;
}
