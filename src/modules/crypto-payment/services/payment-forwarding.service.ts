import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { CryptoCurrency, PaymentStatus } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { SystemWalletService } from './system-wallet.service';
import { BlockchainProviderFactory } from '../blockchain-providers/blockchain-provider.factory';
import { IPaymentForwardingService } from '../interfaces/payment-forwarding.service.interface';

/**
 * Payment Forwarding Service
 * Handles forwarding of confirmed payments to platform wallets
 * Supports BTC, ETH, LTC, BCH, and ERC-20 tokens (USDT, USDC)
 */
@Injectable()
export class PaymentForwardingService implements IPaymentForwardingService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly systemWalletService: SystemWalletService,
        private readonly providerFactory: BlockchainProviderFactory,
        private readonly configService: ConfigService,
        private readonly logger: PinoLogger
    ) {
        this.logger.setContext(PaymentForwardingService.name);
    }

    /**
     * Forward a confirmed payment to platform wallet
     * @param paymentId - Payment ID
     * @returns Forward transaction hash
     */
    async forwardPayment(paymentId: string): Promise<string> {
        this.logger.info({ paymentId }, 'Starting payment forwarding');

        try {
            // Get payment details
            const payment = await this.databaseService.cryptoPayment.findUnique(
                {
                    where: { id: paymentId },
                    include: {
                        order: {
                            select: {
                                id: true,
                                orderNumber: true,
                            },
                        },
                    },
                }
            );

            if (!payment) {
                throw new NotFoundException(`Payment not found: ${paymentId}`);
            }

            // Validate payment status
            if (
                payment.status !== PaymentStatus.CONFIRMED &&
                payment.status !== PaymentStatus.FORWARDED
            ) {
                throw new BadRequestException(
                    `Payment must be CONFIRMED before forwarding. Current status: ${payment.status}`
                );
            }

            // Check if already forwarded
            if (payment.status === PaymentStatus.FORWARDED) {
                this.logger.warn(
                    { paymentId, forwardTxHash: payment.forwardTxHash },
                    'Payment already forwarded'
                );
                return payment.forwardTxHash || '';
            }

            // Update status to FORWARDING
            await this.databaseService.cryptoPayment.update({
                where: { id: paymentId },
                data: {
                    status: PaymentStatus.FORWARDING,
                },
            });

            this.logger.info(
                { paymentId, cryptocurrency: payment.cryptocurrency },
                'Payment status updated to FORWARDING'
            );

            // Decrypt private key
            const privateKey = await this.systemWalletService.decryptPrivateKey(
                payment.encryptedPrivateKey
            );

            // Get platform wallet address
            const platformWalletAddress =
                this.systemWalletService.getPlatformWalletAddress(
                    payment.cryptocurrency
                );

            // Get blockchain provider
            const provider = this.providerFactory.getProvider(
                payment.cryptocurrency
            );

            // Calculate amount to forward
            // Use orderAmount from metadata if available (gas fee already included in total amount)
            const amountToForward = await this.calculateAmountToForward(
                paymentId,
                payment.cryptocurrency,
                payment.paymentAddress,
                parseFloat(payment.amount.toString()),
                payment.metadata
            );

            let forwardTxHash: string;

            // Forward payment
            if (
                payment.cryptocurrency === CryptoCurrency.USDT_ERC20 ||
                payment.cryptocurrency === CryptoCurrency.USDC_ERC20
            ) {
                forwardTxHash = await this.forwardERC20Token(
                    payment,
                    privateKey,
                    platformWalletAddress,
                    amountToForward
                );
            } else {
                forwardTxHash = await provider.sendTransaction(
                    payment.paymentAddress,
                    platformWalletAddress,
                    amountToForward.toString(),
                    privateKey
                );
            }

            // Update payment with forward transaction hash
            await this.databaseService.cryptoPayment.update({
                where: { id: paymentId },
                data: {
                    status: PaymentStatus.FORWARDED,
                    forwardTxHash: forwardTxHash,
                    forwardedAt: new Date(),
                    metadata: {
                        forwardedAmount: amountToForward,
                    },
                },
            });

            this.logger.info(
                {
                    paymentId,
                    orderId: payment.orderId,
                    cryptocurrency: payment.cryptocurrency,
                    forwardTxHash,
                    amountForwarded: amountToForward,
                    platformWallet: platformWalletAddress,
                },
                'Payment forwarded successfully'
            );

            return forwardTxHash;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';

            try {
                const payment =
                    await this.databaseService.cryptoPayment.findUnique({
                        where: { id: paymentId },
                        select: {
                            metadata: true,
                            orderId: true,
                        },
                    });

                const metadata = (payment?.metadata as any) || {};
                await this.databaseService.cryptoPayment.update({
                    where: { id: paymentId },
                    data: {
                        status: PaymentStatus.FORWARDING_FAILED,
                        metadata: {
                            ...metadata,
                            forwardingError: errorMessage,
                            forwardingFailedAt: new Date().toISOString(),
                        },
                    },
                });

                this.logger.error(
                    {
                        paymentId,
                        orderId: payment?.orderId,
                        error: errorMessage,
                        stack: error instanceof Error ? error.stack : undefined,
                    },
                    'Payment forwarding failed'
                );
            } catch (updateError) {
                this.logger.error(
                    { error: updateError, paymentId },
                    'Failed to update payment status after forwarding error'
                );
            }

            throw error;
        }
    }

    /**
     * Forward ERC-20 token payment
     */
    private async forwardERC20Token(
        payment: any,
        privateKey: string,
        platformWalletAddress: string,
        amount: number
    ): Promise<string> {
        const ethereumProvider = this.providerFactory.getEthereumProvider();

        // Get token contract address
        let tokenContract: string;
        if (payment.cryptocurrency === CryptoCurrency.USDT_ERC20) {
            tokenContract =
                ethereumProvider.getTokenContractAddress('USDT') || '';
        } else if (payment.cryptocurrency === CryptoCurrency.USDC_ERC20) {
            tokenContract =
                ethereumProvider.getTokenContractAddress('USDC') || '';
        } else {
            throw new BadRequestException(
                `Unsupported ERC-20 token: ${payment.cryptocurrency}`
            );
        }

        if (!tokenContract) {
            throw new BadRequestException(
                `Token contract address not found for ${payment.cryptocurrency}`
            );
        }

        this.logger.info(
            {
                paymentId: payment.id,
                tokenContract,
                amount,
                from: payment.paymentAddress,
                to: platformWalletAddress,
            },
            'Forwarding ERC-20 token'
        );

        // Send ERC-20 token transaction
        return await ethereumProvider.sendERC20TransactionPublic(
            payment.paymentAddress,
            platformWalletAddress,
            amount.toString(),
            privateKey,
            tokenContract
        );
    }

    /**
     * Calculate amount to forward
     * If orderAmount exists in metadata, use it (gas fee already included in total amount)
     * Otherwise, fallback to old logic (balance - fee) for backward compatibility
     * @param paymentId - Payment ID
     * @param cryptocurrency - Cryptocurrency type
     * @param fromAddress - Source address
     * @param totalAmount - Total amount received (includes gas fee if new flow)
     * @param metadata - Payment metadata (may contain orderAmount)
     * @returns Amount to forward (order amount, not including gas fee)
     */
    private async calculateAmountToForward(
        paymentId: string,
        cryptocurrency: CryptoCurrency,
        fromAddress: string,
        totalAmount: number,
        metadata?: any
    ): Promise<number> {
        try {
            // Check if orderAmount exists in metadata (new flow with gas fee upfront)
            const orderAmount = metadata?.orderAmount;
            if (
                orderAmount &&
                typeof orderAmount === 'number' &&
                orderAmount > 0
            ) {
                this.logger.debug(
                    {
                        paymentId,
                        cryptocurrency,
                        orderAmount,
                        totalAmount,
                        estimatedGasFee: metadata?.estimatedGasFee,
                    },
                    'Using orderAmount from metadata (gas fee already included in total amount)'
                );

                // Return orderAmount (gas fee will be deducted from remaining balance)
                return orderAmount;
            }

            // Fallback to old logic for backward compatibility
            this.logger.debug(
                { paymentId, cryptocurrency },
                'Using legacy calculation (balance - fee) for backward compatibility'
            );

            const provider = this.providerFactory.getProvider(cryptocurrency);
            const balanceStr = await provider.getBalance(fromAddress);
            const actualBalance = parseFloat(balanceStr);

            const estimatedFee = await this.estimateForwardingFee(
                paymentId,
                fromAddress
            );
            const baseFeeAmount = parseFloat(estimatedFee);
            const safetyBufferMultiplier = 1.3;
            const feeAmountWithBuffer = baseFeeAmount * safetyBufferMultiplier;

            const amountToForward = Math.max(
                0,
                actualBalance - feeAmountWithBuffer
            );

            this.logger.debug(
                {
                    paymentId,
                    cryptocurrency,
                    actualBalance,
                    feeAmountWithBuffer,
                    amountToForward,
                },
                'Calculated amount to forward using legacy method'
            );

            if (actualBalance < feeAmountWithBuffer) {
                throw new Error(
                    `Insufficient balance for forwarding. Balance: ${actualBalance}, Required fee (with buffer): ${feeAmountWithBuffer}`
                );
            }

            if (amountToForward <= 0) {
                throw new Error(
                    `Insufficient balance for forwarding fees. Balance: ${actualBalance}, Fee (with buffer): ${feeAmountWithBuffer}`
                );
            }

            return amountToForward;
        } catch (error) {
            this.logger.error(
                { error, paymentId, cryptocurrency, totalAmount },
                'Failed to calculate amount to forward'
            );
            throw error;
        }
    }

    /**
     * Check if payment should be forwarded
     * @param paymentId - Payment ID
     * @returns True if payment should be forwarded
     */
    async shouldForwardPayment(paymentId: string): Promise<boolean> {
        try {
            // Get payment
            const payment = await this.databaseService.cryptoPayment.findUnique(
                {
                    where: { id: paymentId },
                    select: {
                        status: true,
                        forwardTxHash: true,
                    },
                }
            );

            if (!payment) {
                return false;
            }

            // Only forward confirmed payments that haven't been forwarded
            return (
                payment.status === PaymentStatus.CONFIRMED &&
                !payment.forwardTxHash
            );
        } catch (error) {
            this.logger.error(
                { error, paymentId },
                'Failed to check if payment should be forwarded'
            );
            return false;
        }
    }

    /**
     * Get estimated forwarding fee using dynamic blockchain provider estimation
     * @param paymentId - Payment ID
     * @param fromAddress - Optional source address for estimation
     * @returns Estimated fee in cryptocurrency
     */
    async estimateForwardingFee(
        paymentId: string,
        fromAddress?: string
    ): Promise<string> {
        try {
            const payment = await this.databaseService.cryptoPayment.findUnique(
                {
                    where: { id: paymentId },
                    select: {
                        cryptocurrency: true,
                        paymentAddress: true,
                        platformWalletAddress: true,
                        amount: true,
                    },
                }
            );

            if (!payment) {
                throw new NotFoundException(`Payment not found: ${paymentId}`);
            }

            const provider = this.providerFactory.getProvider(
                payment.cryptocurrency
            );

            const from = fromAddress || payment.paymentAddress;
            const to = payment.platformWalletAddress;
            const amount = payment.amount.toString();

            // Try to use dynamic fee estimation from blockchain provider
            try {
                const estimatedFee = await provider.estimateFee(
                    from,
                    to,
                    amount
                );

                this.logger.debug(
                    {
                        paymentId,
                        cryptocurrency: payment.cryptocurrency,
                        estimatedFee,
                        method: 'dynamic',
                    },
                    'Estimated forwarding fee using blockchain provider'
                );

                return estimatedFee;
            } catch (error) {
                this.logger.warn(
                    { error, paymentId },
                    'Failed to estimate dynamic fee from provider, using fallback'
                );

                // Fallback to default fees
                const defaultFees: Record<CryptoCurrency, number> = {
                    BTC: 0.00001,
                    ETH: 0.001,
                    LTC: 0.0001,
                    BCH: 0.00001,
                    USDT_ERC20: 0.001,
                    USDT_TRC20: 0,
                    USDC_ERC20: 0.001,
                };

                const defaultFee =
                    defaultFees[payment.cryptocurrency] || 0.00001;

                this.logger.debug(
                    {
                        paymentId,
                        cryptocurrency: payment.cryptocurrency,
                        estimatedFee: defaultFee,
                        method: 'fallback',
                    },
                    'Using fallback default forwarding fee'
                );

                return defaultFee.toString();
            }
        } catch (error) {
            this.logger.error(
                { error, paymentId },
                'Failed to estimate forwarding fee'
            );
            // Return conservative default fee
            return '0.001';
        }
    }
}
