import {
    Controller,
    Get,
    HttpStatus,
    Param,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { DocPaginatedResponse } from 'src/common/doc/decorators/doc.paginated.decorator';
import { DocResponse } from 'src/common/doc/decorators/doc.response.decorator';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { QueryTransformPipe } from 'src/common/request/pipes/query-transform.pipe';
import { ApiPaginatedDataDto } from 'src/common/response/dtos/response.paginated.dto';

import { CryptoPaymentListQueryDto } from '../dtos/request/crypto-payment-list.request';
import { CryptoPaymentResponseDto } from '../dtos/response/crypto-payment.response';
import { CryptoPaymentService } from '../services/crypto-payment.service';
import { BlockchainMonitorService } from '../services/blockchain-monitor.service';
import { PaymentForwardingService } from '../services/payment-forwarding.service';
import { SystemWalletService } from '../services/system-wallet.service';
import { DatabaseService } from 'src/common/database/services/database.service';
import { CryptoCurrency } from '@prisma/client';

@ApiTags('admin.crypto-payment')
@Controller({
    path: '/admin/crypto-payments',
    version: '1',
})
export class CryptoPaymentAdminController {
    constructor(
        private readonly cryptoPaymentService: CryptoPaymentService,
        private readonly monitorService: BlockchainMonitorService,
        private readonly forwardingService: PaymentForwardingService,
        private readonly systemWalletService: SystemWalletService,
        private readonly databaseService: DatabaseService
    ) {}

    @Get()
    @AllowedRoles([Role.ADMIN, Role.MANAGER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'List all crypto payments' })
    @DocPaginatedResponse({
        serialization: CryptoPaymentResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'crypto-payment.success.listRetrieved',
    })
    public async getAllPayments(
        @Query(QueryTransformPipe) query: CryptoPaymentListQueryDto
    ): Promise<ApiPaginatedDataDto<CryptoPaymentResponseDto>> {
        const page = query.page || 1;
        const limit = query.limit || 10;

        const where: any = {};

        if (query.status) {
            where.status = query.status;
        }

        if (query.cryptocurrency) {
            where.cryptocurrency = query.cryptocurrency;
        }

        if (query.orderId) {
            where.orderId = query.orderId;
        }

        const [payments, total] = await Promise.all([
            this.databaseService.cryptoPayment.findMany({
                where,
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                            userId: true,
                            status: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.databaseService.cryptoPayment.count({ where }),
        ]);

        // Map payments to response DTOs
        const items: CryptoPaymentResponseDto[] = [];
        for (const payment of payments) {
            try {
                const paymentDto = await this.mapPaymentToDto(payment);
                items.push(paymentDto);
            } catch (error) {
                // Skip payments that fail to map
                continue;
            }
        }

        return {
            metadata: {
                totalItems: total,
                itemsPerPage: limit,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
            },
            items,
        };
    }

    @Get(':id')
    @AllowedRoles([Role.ADMIN, Role.MANAGER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get crypto payment detail' })
    @DocResponse({
        serialization: CryptoPaymentResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'crypto-payment.success.retrieved',
    })
    public async getPaymentDetail(
        @Param('id') paymentId: string
    ): Promise<CryptoPaymentResponseDto> {
        const payment = await this.databaseService.cryptoPayment.findUnique({
            where: { id: paymentId },
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        userId: true,
                        status: true,
                    },
                },
            },
        });

        if (!payment) {
            throw new Error(`Payment not found: ${paymentId}`);
        }

        return this.mapPaymentToDto(payment);
    }

    @Post(':id/verify')
    @AllowedRoles([Role.ADMIN, Role.MANAGER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Manually verify payment' })
    @DocResponse({
        serialization: CryptoPaymentResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'crypto-payment.success.verified',
    })
    public async verifyPayment(
        @Param('id') paymentId: string
    ): Promise<CryptoPaymentResponseDto> {
        // Manually trigger payment verification
        await this.monitorService.checkPayment(paymentId);

        // Get updated payment
        const payment = await this.databaseService.cryptoPayment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            throw new Error(`Payment not found: ${paymentId}`);
        }

        return this.mapPaymentToDto(payment);
    }

    @Post(':id/forward')
    @AllowedRoles([Role.ADMIN, Role.MANAGER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Manually forward payment to platform wallet' })
    @DocResponse({
        serialization: CryptoPaymentResponseDto,
        httpStatus: HttpStatus.OK,
        messageKey: 'crypto-payment.success.forwarded',
    })
    public async forwardPayment(
        @Param('id') paymentId: string
    ): Promise<CryptoPaymentResponseDto> {
        // Manually trigger payment forwarding
        await this.forwardingService.forwardPayment(paymentId);

        // Get updated payment
        const payment = await this.databaseService.cryptoPayment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            throw new Error(`Payment not found: ${paymentId}`);
        }

        return this.mapPaymentToDto(payment);
    }

    @Get('wallet-indexes')
    @AllowedRoles([Role.ADMIN, Role.MANAGER])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Get wallet derivation indexes' })
    @DocResponse({
        serialization: Object,
        httpStatus: HttpStatus.OK,
        messageKey: 'crypto-payment.success.walletIndexesRetrieved',
    })
    public async getWalletIndexes(): Promise<{
        indexes: Array<{
            cryptocurrency: CryptoCurrency;
            nextIndex: number;
            updatedAt: Date;
        }>;
    }> {
        const indexes = await this.databaseService.systemWalletIndex.findMany({
            orderBy: {
                cryptocurrency: 'asc',
            },
        });

        return {
            indexes: indexes.map(idx => ({
                cryptocurrency: idx.cryptocurrency,
                nextIndex: idx.nextIndex,
                updatedAt: idx.updatedAt,
            })),
        };
    }

    /**
     * Map payment to response DTO
     * Helper method to avoid accessing private methods
     */
    private async mapPaymentToDto(
        payment: any
    ): Promise<CryptoPaymentResponseDto> {
        const now = new Date();
        const timeRemaining = Math.max(
            0,
            Math.floor((payment.expiresAt.getTime() - now.getTime()) / 1000)
        );

        // Generate QR code
        const { generatePaymentQRCode, generatePaymentURI } =
            await import('../utils/qr-code.util');
        let qrCode = '';
        let paymentUri = '';

        try {
            qrCode = await generatePaymentQRCode(
                payment.paymentAddress,
                parseFloat(payment.amount.toString()),
                payment.cryptocurrency
            );
            paymentUri = generatePaymentURI(
                payment.paymentAddress,
                parseFloat(payment.amount.toString()),
                payment.cryptocurrency
            );
        } catch (error) {
            // QR code generation failed, continue without it
        }

        return {
            paymentId: payment.id,
            orderId: payment.orderId,
            cryptocurrency: payment.cryptocurrency,
            network: payment.network || undefined,
            paymentAddress: payment.paymentAddress,
            amount: payment.amount.toString(),
            amountUsd: payment.amountUsd.toString(),
            exchangeRate: payment.exchangeRate?.toString() || undefined,
            qrCode,
            status: payment.status,
            expiresAt: payment.expiresAt,
            timeRemaining,
            txHash: payment.txHash || undefined,
            confirmations: payment.confirmations,
            requiredConfirmations: payment.requiredConfirmations,
            paymentUri,
            createdAt: payment.createdAt,
        };
    }
}
