import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';

import { CreateCryptoPaymentDto } from '../dtos/request/crypto-payment.create.request';
import { CryptoPaymentResponseDto } from '../dtos/response/crypto-payment.response';
import { PaymentStatusResponseDto } from '../dtos/response/payment-status.response';
import { CryptoPaymentService } from '../services/crypto-payment.service';

@ApiTags('public.crypto-payment')
@Controller({
    path: '/orders',
    version: '1',
})
export class CryptoPaymentPublicController {
    constructor(private readonly cryptoPaymentService: CryptoPaymentService) {}

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
