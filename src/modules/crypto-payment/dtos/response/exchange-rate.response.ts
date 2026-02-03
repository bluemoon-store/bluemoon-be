import { ApiProperty } from '@nestjs/swagger';
import { CryptoCurrency } from '@prisma/client';

export class ExchangeRateResponseDto {
    @ApiProperty({
        description: 'Cryptocurrency',
        enum: CryptoCurrency,
    })
    cryptocurrency: CryptoCurrency;

    @ApiProperty({ description: 'Fiat currency' })
    fiatCurrency: string;

    @ApiProperty({ description: 'Exchange rate' })
    rate: number;

    @ApiProperty({ description: 'Rate provider' })
    provider: string;

    @ApiProperty({ description: 'Last updated time' })
    updatedAt: Date;
}

export class AllExchangeRatesResponseDto {
    @ApiProperty({
        description: 'Exchange rates for all cryptocurrencies',
        type: [ExchangeRateResponseDto],
    })
    rates: ExchangeRateResponseDto[];

    @ApiProperty({ description: 'Fiat currency' })
    fiatCurrency: string;

    @ApiProperty({ description: 'Timestamp' })
    timestamp: Date;
}
