import { ApiProperty } from '@nestjs/swagger';
import { CryptoCurrency } from '@prisma/client';
import { Expose } from 'class-transformer';

export class ExchangeRateResponseDto {
    @ApiProperty({
        description: 'Cryptocurrency',
        enum: CryptoCurrency,
    })
    @Expose()
    cryptocurrency: CryptoCurrency;

    @ApiProperty({ description: 'Fiat currency' })
    @Expose()
    fiatCurrency: string;

    @ApiProperty({ description: 'Exchange rate' })
    @Expose()
    rate: number;

    @ApiProperty({ description: 'Rate provider' })
    @Expose()
    provider: string;

    @ApiProperty({ description: 'Last updated time' })
    @Expose()
    updatedAt: Date;
}

export class AllExchangeRatesResponseDto {
    @ApiProperty({
        description: 'Exchange rates for all cryptocurrencies',
        type: [ExchangeRateResponseDto],
    })
    @Expose()
    rates: ExchangeRateResponseDto[];

    @ApiProperty({ description: 'Fiat currency' })
    @Expose()
    fiatCurrency: string;

    @ApiProperty({ description: 'Timestamp' })
    @Expose()
    timestamp: Date;
}
