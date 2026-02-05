import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiExcludeController,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';

import { CreateCryptoPaymentDto } from '../dtos/request/crypto-payment.create.request';
import { CryptoPaymentResponseDto } from '../dtos/response/crypto-payment.response';
import { PaymentStatusResponseDto } from '../dtos/response/payment-status.response';
import {
    ExchangeRateResponseDto,
    AllExchangeRatesResponseDto,
} from '../dtos/response/exchange-rate.response';
import { CryptoPaymentService } from '../services/crypto-payment.service';
import { ExchangeRateService } from '../services/exchange-rate.service';
import { CryptoCurrency } from '@prisma/client';

@ApiTags('public.crypto-payment')
@Controller({
    path: '/orders',
    version: '1',
})
export class CryptoPaymentPublicController {
    constructor(
        private readonly cryptoPaymentService: CryptoPaymentService,
        private readonly exchangeRateService: ExchangeRateService
    ) {}

    @Post(':orderId/crypto-payment')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Create crypto payment for order' })
    @DocResponse({
        serialization: CryptoPaymentResponseDto,
        httpStatus: HttpStatus.CREATED,
        messageKey: 'crypto-payment.success.created',
    })
    public async createPayment(
        @Param('orderId') orderId: string,
        @Body() dto: CreateCryptoPaymentDto,
        @AuthUser() user: IAuthUser
    ): Promise<CryptoPaymentResponseDto> {
        return this.cryptoPaymentService.createPayment(
            orderId,
            dto.cryptocurrency,
            user.userId
        );
    }

    @Get(':orderId/crypto-payment/status')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Check payment status by order ID' })
    @DocResponse({
        serialization: PaymentStatusResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'crypto-payment.success.statusRetrieved',
    })
    public async getPaymentStatusByOrderId(
        @Param('orderId') orderId: string,
        @AuthUser() user: IAuthUser
    ): Promise<PaymentStatusResponseDto> {
        // Get payment by order ID first
        const payment = await this.cryptoPaymentService.getPaymentByOrderId(
            orderId,
            user.userId
        );
        // Then get status
        return this.cryptoPaymentService.getPaymentStatus(
            payment.paymentId,
            user.userId
        );
    }

    @Get(':orderId/crypto-payment')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get payment by order ID' })
    @DocResponse({
        serialization: CryptoPaymentResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'crypto-payment.success.retrieved',
    })
    public async getPaymentByOrderId(
        @Param('orderId') orderId: string,
        @AuthUser() user: IAuthUser
    ): Promise<CryptoPaymentResponseDto> {
        return this.cryptoPaymentService.getPaymentByOrderId(
            orderId,
            user.userId
        );
    }
}

@ApiExcludeController()
@ApiTags('public.crypto')
@Controller({
    path: '/crypto',
    version: '1',
})
export class CryptoPublicController {
    constructor(private readonly exchangeRateService: ExchangeRateService) {}

    @Get('exchange-rates')
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

    @Get('exchange-rates/:cryptocurrency')
    @ApiBearerAuth('accessToken')
    @ApiOperation({
        summary: 'Get exchange rate for a specific cryptocurrency',
    })
    @DocResponse({
        serialization: ExchangeRateResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'crypto-payment.success.exchangeRateRetrieved',
    })
    public async getExchangeRate(
        @Param('cryptocurrency') cryptocurrency: CryptoCurrency
    ): Promise<ExchangeRateResponseDto> {
        const rate = await this.exchangeRateService.getRate(
            cryptocurrency,
            'USD'
        );

        return {
            cryptocurrency,
            fiatCurrency: 'USD',
            rate,
            provider: 'tatum', // Default provider
            updatedAt: new Date(),
        };
    }

    @Get('supported-currencies')
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get list of supported cryptocurrencies' })
    @DocResponse({
        serialization: Object,
        httpStatus: HttpStatus.OK,
        messageKey: 'crypto-payment.success.supportedCurrenciesRetrieved',
    })
    public async getSupportedCurrencies(): Promise<{
        currencies: Array<{
            symbol: CryptoCurrency;
            name: string;
            network?: string;
        }>;
    }> {
        const currencies = [
            { symbol: CryptoCurrency.BTC, name: 'Bitcoin', network: 'mainnet' },
            {
                symbol: CryptoCurrency.ETH,
                name: 'Ethereum',
                network: 'mainnet',
            },
            {
                symbol: CryptoCurrency.LTC,
                name: 'Litecoin',
                network: 'mainnet',
            },
            {
                symbol: CryptoCurrency.BCH,
                name: 'Bitcoin Cash',
                network: 'mainnet',
            },
            {
                symbol: CryptoCurrency.USDT_ERC20,
                name: 'Tether USD',
                network: 'ERC20',
            },
            {
                symbol: CryptoCurrency.USDT_TRC20,
                name: 'Tether USD',
                network: 'TRC20',
            },
            {
                symbol: CryptoCurrency.USDC_ERC20,
                name: 'USD Coin',
                network: 'ERC20',
            },
        ];

        return { currencies };
    }
}
