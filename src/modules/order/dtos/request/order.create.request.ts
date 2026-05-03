import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

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

    @ApiPropertyOptional({
        description:
            'When true, adds buyer protection fee ($5 USD) to the order total',
    })
    @IsOptional()
    @IsBoolean()
    buyerProtection?: boolean;

    @ApiPropertyOptional({ example: 'SUMMER25' })
    @IsOptional()
    @IsString()
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toUpperCase() : value
    )
    @MaxLength(64)
    couponCode?: string;
}
