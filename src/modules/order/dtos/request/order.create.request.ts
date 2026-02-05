import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { CryptoCurrency } from '@prisma/client';

export class OrderCreateDto {
    @ApiPropertyOptional({
        example: 'USD',
        default: 'USD',
        description: 'Currency for the order',
    })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    currency?: string;

    @ApiPropertyOptional({
        example: 'Special instructions for this order',
        description: 'Optional notes for the order',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}
