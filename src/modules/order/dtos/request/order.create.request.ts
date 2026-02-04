import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { CryptoCurrency } from '@prisma/client';

export enum PaymentMethod {
    WALLET = 'WALLET',
    CRYPTO = 'CRYPTO',
}

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
        enum: PaymentMethod,
        example: PaymentMethod.WALLET,
        description: 'Payment method for the order',
    })
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional({
        enum: CryptoCurrency,
        example: CryptoCurrency.BTC,
        description:
            'Cryptocurrency to use for payment (required if paymentMethod is CRYPTO)',
    })
    @IsOptional()
    @IsEnum(CryptoCurrency)
    cryptocurrency?: CryptoCurrency;
}
