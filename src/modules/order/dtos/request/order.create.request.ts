import { ApiPropertyOptional } from '@nestjs/swagger';
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
}
