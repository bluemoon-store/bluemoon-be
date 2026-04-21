import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsEnum, IsIn, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

/**
 * Query parameters for order history
 */
export class OrderHistoryQueryDto {
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
        description: 'Sort field',
        enum: ['createdAt', 'totalAmount'],
    })
    @IsOptional()
    @IsIn(['createdAt', 'totalAmount'])
    sortBy?: 'createdAt' | 'totalAmount';

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: ['asc', 'desc'],
    })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';

    @ApiPropertyOptional({
        description: 'Filter by cryptocurrency payment method',
        example: 'BTC',
    })
    @IsOptional()
    @IsString()
    cryptocurrency?: string;
}
