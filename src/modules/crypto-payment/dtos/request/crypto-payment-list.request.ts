import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CryptoCurrency, PaymentStatus } from '@prisma/client';

/**
 * Query parameters for listing crypto payments (admin)
 */
export class CryptoPaymentListQueryDto {
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
        description: 'Filter by payment status',
        enum: PaymentStatus,
    })
    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;

    @ApiPropertyOptional({
        description: 'Filter by cryptocurrency',
        enum: CryptoCurrency,
    })
    @IsOptional()
    @IsEnum(CryptoCurrency)
    cryptocurrency?: CryptoCurrency;

    @ApiPropertyOptional({
        description: 'Filter by order ID',
        example: 'uuid',
    })
    @IsOptional()
    @IsString()
    orderId?: string;
}
