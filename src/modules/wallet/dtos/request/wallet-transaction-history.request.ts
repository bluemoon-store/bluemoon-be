import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters for wallet transaction history
 */
export class WalletTransactionHistoryQueryDto {
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
        description: 'Filter by transaction type',
        example: 'DEPOSIT',
    })
    @IsOptional()
    @IsString()
    type?: string;

    @ApiPropertyOptional({
        description: 'Sort field',
        enum: ['createdAt', 'amount'],
    })
    @IsOptional()
    @IsIn(['createdAt', 'amount'])
    sortBy?: 'createdAt' | 'amount';

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: ['asc', 'desc'],
    })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';
}
