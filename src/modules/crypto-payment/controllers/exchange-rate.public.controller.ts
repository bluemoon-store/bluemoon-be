import {
    Controller,
    Get,
    HttpStatus,
    Param,
    ParseEnumPipe,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';

import {
    ExchangeRateResponseDto,
    AllExchangeRatesResponseDto,
} from '../dtos/response/exchange-rate.response';
import { ExchangeRateService } from '../services/exchange-rate.service';
import { CryptoCurrency } from '@prisma/client';

@ApiTags('public.crypto')
@Controller({
    path: '/crypto/exchange-rates',
    version: '1',
})
export class ExchangeRatePublicController {
    constructor(private readonly exchangeRateService: ExchangeRateService) {}

    @Get()
    @ApiBearerAuth('accessToken')
    @ApiOperation({
        summary: 'Get current exchange rates for all cryptocurrencies',
    })
    @DocResponse({
        serialization: AllExchangeRatesResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'crypto-payment.success.exchangeRatesRetrieved',
    })
    public async getExchangeRates(): Promise<AllExchangeRatesResponseDto> {
        const rates = await this.exchangeRateService.getAllRates('USD');
        const rateArray: ExchangeRateResponseDto[] = [];

        for (const [crypto, rate] of rates.entries()) {
            rateArray.push({
                cryptocurrency: crypto,
                fiatCurrency: 'USD',
                rate,
                provider: 'tatum', // Default provider
                updatedAt: new Date(),
            });
        }

        return {
            rates: rateArray,
            fiatCurrency: 'USD',
            timestamp: new Date(),
        };
    }

    @Get(':cryptocurrency')
    @ApiBearerAuth('accessToken')
    @ApiOperation({
        summary: 'Get exchange rate for a specific cryptocurrency',
    })
    @ApiParam({
        name: 'cryptocurrency',
        enum: Object.values(CryptoCurrency),
        description: 'Cryptocurrency symbol',
    })
    @DocResponse({
        serialization: ExchangeRateResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'crypto-payment.success.exchangeRateRetrieved',
    })
    public async getExchangeRate(
        @Param(
            'cryptocurrency',
            new ParseEnumPipe(CryptoCurrency, {
                errorHttpStatusCode: HttpStatus.BAD_REQUEST,
            })
        )
        cryptocurrency: string
    ): Promise<ExchangeRateResponseDto> {
        const crypto = cryptocurrency as CryptoCurrency;
        const rate = await this.exchangeRateService.getRate(crypto, 'USD');

        return {
            cryptocurrency: crypto,
            fiatCurrency: 'USD',
            rate,
            provider: 'tatum', // Default provider
            updatedAt: new Date(),
        };
    }
}
