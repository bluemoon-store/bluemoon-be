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
import { EthereumProvider } from '../blockchain-providers/ethereum-provider.service';
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

            // Check if forwarding is enabled
            const enableForwarding = this.configService.get<boolean>(
                'crypto.payment.enableForwarding',
                false
            );

            if (!enableForwarding) {
                this.logger.info(
                    { paymentId },
                    'Payment forwarding is disabled, skipping'
                );
                return '';
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

            // Calculate amount to forward (accounting for fees)
            const amountToForward = await this.calculateAmountToForward(
                paymentId,
                payment.cryptocurrency,
                payment.paymentAddress,
                parseFloat(payment.amount.toString())
            );

            let forwardTxHash: string;

            // Handle ERC-20 tokens differently
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
                // Native cryptocurrency forwarding
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
                        ...((payment.metadata as any) || {}),
                        forwardingFee:
                            parseFloat(payment.amount.toString()) -
                            amountToForward,
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
            // Update status to FAILED if forwarding fails
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            const maxRetries = this.configService.get<number>(
                'crypto.payment.maxForwardingRetries',
                5
            );

            try {
                const existingPayment =
                    await this.databaseService.cryptoPayment.findUnique({
                        where: { id: paymentId },
                        select: {
                            metadata: true,
                            cryptocurrency: true,
                            orderId: true,
                        },
                    });

                const metadata = (existingPayment?.metadata as any) || {};
                const retryCount = (metadata.forwardingRetryCount || 0) + 1;
                const shouldAlert = retryCount >= maxRetries;

                await this.databaseService.cryptoPayment.update({
                    where: { id: paymentId },
                    data: {
                        status: PaymentStatus.FAILED,
                        metadata: {
                            ...metadata,
                            forwardingError: errorMessage,
                            forwardingFailedAt: new Date().toISOString(),
                            forwardingRetryCount: retryCount,
                            requiresAdminReview: shouldAlert,
                            adminAlertSent: shouldAlert,
                            lastError: {
                                message: errorMessage,
                                stack:
                                    error instanceof Error
                                        ? error.stack
                                        : undefined,
                                timestamp: new Date().toISOString(),
                            },
                        },
                    },
                });

                // Log admin alert
                if (shouldAlert) {
                    this.logger.error(
                        {
                            paymentId,
                            orderId: existingPayment.orderId,
                            cryptocurrency: existingPayment?.cryptocurrency,
                            retryCount,
                            maxRetries,
                            error: errorMessage,
                            ALERT: 'ADMIN_ACTION_REQUIRED',
                        },
                        '🚨 ADMIN ALERT: Payment forwarding failed after max retries'
                    );

                    // TODO: Send actual notification (email, Slack, etc.)
                    // await this.notificationService.sendAdminAlert({
                    //     type: 'FORWARDING_FAILURE',
                    //     paymentId,
                    //     orderId: payment.orderId,
                    //     error: errorMessage,
                    //     retryCount,
                    // });
                }
            } catch (updateError) {
                this.logger.error(
                    { error: updateError, paymentId },
                    'Failed to update payment status to FAILED'
                );
            }

            this.logger.error(
                {
                    error,
                    paymentId,
                    stack: error instanceof Error ? error.stack : undefined,
                },
                'Failed to forward payment'
            );

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
     * Calculate amount to forward (accounting for network fees using dynamic estimation)
     * @param paymentId - Payment ID
     * @param cryptocurrency - Cryptocurrency type
     * @param fromAddress - Source address
     * @param totalAmount - Total amount received
     * @returns Amount to forward after fees
     */
    private async calculateAmountToForward(
        paymentId: string,
        cryptocurrency: CryptoCurrency,
        fromAddress: string,
        totalAmount: number
    ): Promise<number> {
        try {
            // Use dynamic fee estimation from blockchain provider
            const estimatedFee = await this.estimateForwardingFee(
                paymentId,
                fromAddress
            );

            const feeAmount = parseFloat(estimatedFee);

            // Calculate amount to forward (total - fee)
            const amountToForward = Math.max(0, totalAmount - feeAmount);

            this.logger.debug(
                {
                    paymentId,
                    cryptocurrency,
                    totalAmount,
                    estimatedFee: feeAmount,
                    amountToForward,
                    feePercentage: (feeAmount / totalAmount) * 100,
                },
                'Calculated amount to forward using dynamic fee estimation'
            );

            // Safety check: ensure we're not forwarding more than received
            if (amountToForward > totalAmount) {
                throw new Error(
                    `Calculated forward amount (${amountToForward}) exceeds total amount (${totalAmount})`
                );
            }

            // Safety check: ensure we have enough for fees
            if (amountToForward <= 0) {
                throw new Error(
                    `Insufficient balance for forwarding fees. Total: ${totalAmount}, Fee: ${feeAmount}`
                );
            }

            // Warning if fee is unusually high (> 10% of amount)
            const feePercentage = (feeAmount / totalAmount) * 100;
            if (feePercentage > 10) {
                this.logger.warn(
                    {
                        paymentId,
                        cryptocurrency,
                        feePercentage,
                        feeAmount,
                        totalAmount,
                    },
                    'Network fee is unusually high (>10% of amount)'
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
            // Check if forwarding is enabled
            const enableForwarding = this.configService.get<boolean>(
                'crypto.payment.enableForwarding',
                false
            );

            if (!enableForwarding) {
                return false;
            }

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
